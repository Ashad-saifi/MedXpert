import mongoose from "mongoose";
import dotenv from "dotenv";

// Ensure all models are registered on mongoose.models for the In-Memory Mock DB
import "../models/User.js";
import "../models/Doctor.js";
import "../models/Patient.js";
import "../models/Appointment.js";
import "../models/Prescription.js";
import "../models/LabReport.js";
import "../models/ActivityLog.js";
import "../models/SystemSetting.js";
import "../models/ContactRequest.js";

dotenv.config();

const connectDB = async () => {
    // Try connecting to the specified MONGO_URI
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/medxpert";
    try {
        console.log(`Attempting to connect to MongoDB...`);
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 1500
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`⚠️  MongoDB Connection failed: ${error.message}`);
        console.warn(`👉 Activating ultra-fast, zero-dependency In-Memory JS Database Mock...`);

        await setupInMemoryMock();
    }
};

async function setupInMemoryMock() {
    const memDB = {};

    // Mock connection
    mongoose.connect = async () => {
        return { connection: { host: "in-memory-js-mock-db" } };
    };

    class MockQuery {
        constructor(data) {
            this.data = data;
        }
        sort(sortObj) {
            if (!this.data || !Array.isArray(this.data)) return this;
            if (typeof sortObj === 'string') {
                const desc = sortObj.startsWith('-');
                const key = desc ? sortObj.substring(1) : sortObj;
                this.data.sort((a, b) => {
                    const valA = a[key] || '';
                    const valB = b[key] || '';
                    return desc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
                });
            } else if (sortObj && typeof sortObj === 'object') {
                const entry = Object.entries(sortObj)[0];
                if (entry) {
                    const [key, dir] = entry;
                    const desc = dir === -1 || dir === 'desc' || dir === 'descending';
                    this.data.sort((a, b) => {
                        const valA = a[key] || '';
                        const valB = b[key] || '';
                        return desc ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
                    });
                }
            }
            return this;
        }
        limit(limitNum) {
            if (this.data && Array.isArray(this.data)) {
                this.data = this.data.slice(0, limitNum);
            }
            return this;
        }
        select() {
            return this;
        }
        populate() {
            return this;
        }
        lean() {
            return this;
        }
        async exec() {
            return this.data;
        }
        then(onFulfilled, onRejected) {
            return Promise.resolve(this.data).then(onFulfilled, onRejected);
        }
        catch(onRejected) {
            return Promise.resolve(this.data).catch(onRejected);
        }
    }

    function matchFilter(item, filter) {
        if (!filter || Object.keys(filter).length === 0) return true;
        for (const [key, val] of Object.entries(filter)) {
            if (key === '$or') {
                if (!Array.isArray(val)) return false;
                const matchesAny = val.some(subFilter => matchFilter(item, subFilter));
                if (!matchesAny) return false;
                continue;
            }

            let itemVal = item[key];

            if (val && typeof val === 'object' && val.$regex !== undefined) {
                const pattern = val.$regex;
                const options = val.$options || '';
                try {
                    const regex = new RegExp(pattern, options);
                    if (!regex.test(String(itemVal || ''))) {
                        return false;
                    }
                } catch (e) {
                    console.error("Regex match failed in mock db:", e);
                    return false;
                }
                continue;
            }

            let filterVal = val;
            if (itemVal && typeof itemVal === 'object' && itemVal._id) {
                itemVal = itemVal._id.toString();
            } else if (itemVal && typeof itemVal === 'object' && itemVal.toString) {
                itemVal = itemVal.toString();
            }
            if (filterVal && typeof filterVal === 'object' && filterVal.toString) {
                filterVal = filterVal.toString();
            }
            if (String(itemVal) !== String(filterVal)) {
                return false;
            }
        }
        return true;
    }

    function applyUpdate(inst, updateObj) {
        // Handle both plain objects and $set style updates
        const fields = updateObj.$set || updateObj;
        for (const [key, val] of Object.entries(fields)) {
            if (!key.startsWith('$')) {
                inst[key] = val;
            }
        }
    }

    function wrapDoc(doc, Model, name) {
        if (!doc) return doc;
        const inst = doc instanceof Model ? doc : new Model(doc);
        // Copy all plain-object fields onto the instance so they are accessible
        if (doc && typeof doc === 'object') {
            for (const key of Object.keys(doc)) {
                if (!(key in inst) || inst[key] === undefined) {
                    inst[key] = doc[key];
                }
            }
        }
        inst.save = async function () {
            const index = memDB[name].findIndex(x => String(x._id) === String(inst._id));
            if (index >= 0) {
                // Merge all current instance fields back into the stored entry
                const stored = memDB[name][index];
                for (const key of Object.keys(inst)) {
                    stored[key] = inst[key];
                }
                memDB[name][index] = inst;
            } else {
                memDB[name].push(inst);
            }
            return inst;
        };
        return inst;
    }

    // Register all registered models
    for (const name of Object.keys(mongoose.models)) {
        memDB[name] = [];
        const Model = mongoose.models[name];

        Model.find = function (filter) {
            const matched = memDB[name].filter(x => matchFilter(x, filter)).map(x => wrapDoc(x, Model, name));
            return new MockQuery(matched);
        };

        Model.findOne = function (filter) {
            const found = memDB[name].find(x => matchFilter(x, filter));
            return new MockQuery(wrapDoc(found, Model, name));
        };

        Model.findById = function (id) {
            const found = memDB[name].find(x => String(x._id) === String(id));
            return new MockQuery(wrapDoc(found, Model, name));
        };

        Model.findByIdAndDelete = async function (id) {
            const index = memDB[name].findIndex(x => String(x._id) === String(id));
            if (index >= 0) {
                const deleted = memDB[name][index];
                memDB[name].splice(index, 1);
                return deleted;
            }
            return null;
        };

        Model.findOneAndDelete = async function (filter) {
            const index = memDB[name].findIndex(x => matchFilter(x, filter));
            if (index >= 0) {
                const deleted = memDB[name][index];
                memDB[name].splice(index, 1);
                return deleted;
            }
            return null;
        };

        Model.findOneAndUpdate = async function (filter, update, options = {}) {
            const index = memDB[name].findIndex(x => matchFilter(x, filter));
            if (index < 0) return null;

            const existing = memDB[name][index];
            applyUpdate(existing, update);

            if (options.new) {
                return wrapDoc(existing, Model, name);
            }
            return wrapDoc(existing, Model, name);
        };

        Model.findByIdAndUpdate = async function (id, update, options = {}) {
            const index = memDB[name].findIndex(x => String(x._id) === String(id));
            if (index < 0) return null;

            const existing = memDB[name][index];
            applyUpdate(existing, update);

            if (options.new) {
                return wrapDoc(existing, Model, name);
            }
            return wrapDoc(existing, Model, name);
        };

        Model.create = async function (docs) {
            const isArray = Array.isArray(docs);
            const docList = isArray ? docs : [docs];
            const created = [];
            for (const doc of docList) {
                const inst = new Model(doc);
                if (!inst._id) {
                    inst._id = new mongoose.Types.ObjectId().toString();
                }
                // Copy plain fields onto inst
                for (const key of Object.keys(doc)) {
                    if (inst[key] === undefined) {
                        inst[key] = doc[key];
                    }
                }
                inst.save = async function () {
                    const index = memDB[name].findIndex(x => String(x._id) === String(inst._id));
                    if (index >= 0) {
                        memDB[name][index] = inst;
                    } else {
                        memDB[name].push(inst);
                    }
                    return inst;
                };
                memDB[name].push(inst);
                created.push(inst);
            }
            return isArray ? created : created[0];
        };

        Model.countDocuments = async function (filter) {
            return memDB[name].filter(x => matchFilter(x, filter)).length;
        };

        Model.deleteOne = async function (filter) {
            const index = memDB[name].findIndex(x => matchFilter(x, filter));
            if (index >= 0) {
                memDB[name].splice(index, 1);
            }
            return { deletedCount: index >= 0 ? 1 : 0 };
        };

        Model.deleteMany = async function (filter) {
            const initialLength = memDB[name].length;
            memDB[name] = memDB[name].filter(x => !matchFilter(x, filter));
            return { deletedCount: initialLength - memDB[name].length };
        };
    }

    // Load and execute seeding function
    console.log("🌱 Seeding in-memory database mock...");
    try {
        const { seedDatabaseForInMemory } = await import("../seed/seedDataHelper.js");
        await seedDatabaseForInMemory();
        console.log("✅ In-memory database mock seeded successfully!");
    } catch (err) {
        console.error("❌ Failed to seed in-memory mock:", err);
    }
}

export default connectDB;
