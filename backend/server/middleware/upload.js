const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  //console.log("MIME TYPE:", file.mimetype);
  //console.log("FILE NAME:", file.originalname);

  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

  if (isPdfMime || isPdfExt) {
    return cb(null, true);
  } else {
    const err = new Error('Only PDF files allowed');
    err.statusCode = 400;
    return cb(err, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = upload;