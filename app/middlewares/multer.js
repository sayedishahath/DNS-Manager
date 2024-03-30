const multer = require('multer');

// Set storage options for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Destination folder for uploaded files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use original filename
  }
});

// File filter for CSV and JSON files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Only CSV and JSON files are allowed')); // Reject file
  }
};

// Create multer instance with storage and file filter options
const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;