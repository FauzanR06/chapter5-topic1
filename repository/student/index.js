const crypto = require("crypto");
const path = require("path");
const { classes, student } = require("../../models");
const { uploader } = require("../../helper/cloudinary");
const { getData, setData, deleteData } = require("../../helper/redis");

exports.getStudents = async () => {
  const data = await student.findAll({
    include: {
      model: classes,
    },
  });
  return data;
};

exports.getStudent = async (id) => {
  // let redisClient, data;
  const key = `student:${id}`;
  let data = await getData(key);
  if (data) {
    return data;
  }

  // get from db
  data = await student.findAll({
    where: {
      id,
    },
    include: {
      model: classes,
    },
  });
  if (data.length > 0) {
    // save to redis
    await setData(key, data[0], 300);

    return data[0];
  }

  throw new Error(`Student is not found!`);
  // try {
  //   redisClient = await redis();
  //   let dataString = await redisClient.get(key);

  //   if (dataString) {
  //     data = JSON.parse(dataString);
  //     return data;
  //   }

  //   data = await student.findAll({
  //     where: {
  //       id,
  //     },
  //     include: {
  //       model: classes,
  //     },
  //   });
  //   if (data.length > 0) {
  //     dataString = JSON.stringify(data[0]);
  //     await redisClient.set(key, dataString, {
  //       EX: 300,
  //     });

  //     return data[0];
  //   }
  //   throw new Error("Student is not found!");
  // } finally {
  //   await redisClient.disconnect();
  // }
  // const data = await student.findAll({
  //   where: {
  //     id,
  //   },
  //   include: {
  //     model: classes,
  //   },
  // });
  // if (data.length > 0) {
  //   return data[0];
  // }
  // throw new Error("Student is not found!");
};

exports.createStudent = async (payload) => {
  if (payload.photo) {
    // upload image to cloudinary
    const { photo } = payload;

    // make unique filename -> 213123128uasod9as8djas
    photo.publicId = crypto.randomBytes(16).toString("hex");

    // rename the file -> 213123128uasod9as8djas.jpg / 213123128uasod9as8djas.png
    photo.name = `${photo.publicId}${path.parse(photo.name).ext}`;

    // Process to upload image
    const imageUpload = await uploader(photo);
    payload.photo = imageUpload.secure_url;
  }

  // save to db
  const data = await student.create(payload);

  // save to redis
  const key = `students:${data.id}`;
  await setData(key, data, 300);

  return data;
  // let redisClient, data;
  // try {
  //   // create
  //   data = await student.create(payload);
  //   // save to redeis
  //   const key = `student:${data.id}`;
  //   redisClient = await redis();
  //   const dataString = JSON.stringify(data);
  //   await redisClient.set(key, dataString, {
  //     EX: 300,
  //   });
  //   return data;
  // } finally {
  //   await redisClient.disconnect();
  // }
  // const data = await student.create(payload);
  // return data;
};

exports.updateStudent = async (id, payload) => {
  const key = `students:${id}`;

  if (payload.photo) {
    // upload image to cloudinary
    const { photo } = payload;

    // make unique filename -> 213123128uasod9as8djas
    photo.publicId = crypto.randomBytes(16).toString("hex");

    // rename the file -> 213123128uasod9as8djas.jpg / 213123128uasod9as8djas.png
    photo.name = `${photo.publicId}${path.parse(photo.name).ext}`;

    // Process to upload image
    const imageUpload = await uploader(photo);
    payload.photo = imageUpload.secure_url;
  }

  // update to postgres
  await student.update(payload, {
    where: {
      id,
    },
  });

  // get from postgres
  const data = await student.findAll({
    where: {
      id,
    },
    include: {
      model: classes,
    },
  });
  if (data.length > 0) {
    // save to redis
    await setData(key, data[0], 300);

    return data[0];
  }

  return data;
  // let redisClient, data;
  // const key = `student:${id}`;
  // try {
  //   // update data
  //   student.update(payload, {
  //     where: {
  //       id,
  //     },
  //   });
  //   // get data from postgres
  //   data = await student.findAll({
  //     where: {
  //       id,
  //     },
  //     include: {
  //       model: classes,
  //     },
  //   });
  //   if (data.length > 0) {
  //     // save to redis (cache)
  //     redisClient = await redis();
  //     const dataString = JSON.stringify(data[0]);
  //     await redisClient.set(key, dataString, {
  //       EX: 300,
  //     });
  //     return data[0];
  //   }
  //   throw new Error(`Student is not found!`);
  // } finally {
  //   await redisClient.disconnect();
  // }
  // const data = await student.update(payload, {
  //   where: {
  //     id,
  //   },
  // });
  // return data;
};

exports.deleteStudent = async (id) => {
  const key = `students:${id}`;

  // delete from postgres
  await student.destroy({ where: { id } });

  // delete from redis
  await deleteData(key);

  return null;
  // let redisClient, data;
  // const key = `student:${id}`;
  // try {
  //   // delete from postgres
  //   await student.destroy({ where: { id } });
  //   // delete from redis
  //   redisClient = await redis();
  //   await redisClient.del(key);
  //   return null;
  // } finally {
  //   await redisClient.disconnect();
  // }
  // await student.destroy({ where: { id } });
  // return null;
};
