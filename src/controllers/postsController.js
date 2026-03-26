const postModel = require("../models/postModel");

exports.createPost = (req, res) => {
  try {
    const caption = req.body.caption;
    const user_id = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Imagen requerida"
      });
    }

    const image_url = req.file.secure_url; // URL ya subida a Cloudinary

    postModel.createPost(user_id, image_url, caption, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }

      res.json({
        success: true,
        message: "Post creado 🚀"
      });
    });
    

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false });
  }
};
exports.getPosts = (req, res) => {
  postModel.getPosts((err, posts) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Error obteniendo posts" });
    }

    res.json({ success: true, posts });
  });
};