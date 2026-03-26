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

    const image_url = req.file.path; // 🔥 URL de cloudinary

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