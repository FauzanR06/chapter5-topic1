const { classes, student } = require("../../models");
const redis = require("../../config/redis");

exports.getClasses = async () => {
  const data = await classes.findAll({
    include: {
      model: student,
    },
  });
  return data;
};

exports.getClass = async (id) => {
  let redisClient, data;
  const key = `classes:${id}`;
  try {
    redisClient = await redis();
    let dataString = await redisClient.get(key);

    if (dataString) {
      data = JSON.parse(dataString);
      return data;
    }

    data = await classes.findAll({
      where: {
        id,
      },
      include: {
        model: student,
      },
    });
    if (data.length > 0) {
      dataString = JSON.stringify(data[0]);
      await redisClient.set(key, dataString, {
        EX: 300,
      });

      return data[0];
    }
    throw new Error("Class is not found!");
  } finally {
    await redisClient.disconnect();
  }
};

exports.createClass = async (payload) => {
  let redisClient, data;
  try {
    // Create data to postgres
    data = await classes.create(payload);

    // Save to redis (cache)
    const key = `classes:${data.id}`;
    redisClient = await redis();
    const dataString = JSON.stringify(data);
    await redisClient.set(key, dataString, {
      EX: 300,
    });

    return data;
  } finally {
    await redisClient.disconnect();
  }
  // const data = await classes.create(payload);
  // return data;
};

exports.updateClass = async (id, payload) => {
  let redisClient, data;
  const key = `classes:${id}`;
  try {
    // update data to postgres
    classes.update(payload, {
      where: {
        id,
      },
    });

    // get data from postgres
    data = await classes.findAll({
      where: {
        id,
      },
      include: {
        model: student,
      },
    });

    if (data.length > 0) {
      // save to redis (cache)
      redisClient = await redis();
      const dataString = JSON.stringify(data[0]);
      await redisClient.set(key, dataString, {
        EX: 300,
      });

      return data[0];
    }

    throw new Error(`Class is not found!`);
  } finally {
    await redisClient.disconnect();
  }
};

exports.deleteClass = async (id) => {
  let redisClient, data;
  const key = `classes:${id}`;
  try {
    // delete from postgres
    data = await classes.destroy({ where: { id } });

    // delete from redis
    redisClient = await redis();
    await redisClient.del(key);

    return null;
  } finally {
    await redisClient.disconnect();
  }
};
