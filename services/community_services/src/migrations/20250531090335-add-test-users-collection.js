module.exports = {
  async up(db, client) {
    await db.createCollection("testusers", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                properties: {
                    firstName: {
                        bsonType: "string",
                    },
                    createdAt: {
                        bsonType: "date",
                    },
                    updatedAt: {
                        bsonType: "date",
                    },
                    deletedAt: {
                        bsonType: "date",
                    },
                    isDeleted: {
                        bsonType: "bool",
                    },
                },
            }
        },
    });
  },

  async down(db, client) {
    await db.collection('testusers').drop();
  }
};