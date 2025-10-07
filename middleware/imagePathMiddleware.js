const setImagePath = (req, res, next) => {
  req.imagePath = `${req.protocol}://${req.get('host')}/imgs/`;
  next();
}

module.exports = setImagePath;