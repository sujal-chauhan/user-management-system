const express = require('express');
const cors = require('cors');
const db = require('./db');
const upload = require('./upload');
const xlsx = require('xlsx');

const app = express();
app.use(cors());
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.send('API is running');
});

//send data to backend -> database
app.post('/api/users', (req, res) => {
  const { first_name, last_name, email, phone_number, pan_number } = req.body;

  if (!first_name || !last_name || !email || !phone_number || !pan_number) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `
    INSERT INTO users (first_name, last_name, email, phone_number, pan_number)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [first_name, last_name, email, phone_number, pan_number], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(201).json({ message: 'User added successfully' });
  });
});

//get data from the backend <- database
app.get('/api/users', (req, res) => {
  const sql = 'SELECT * FROM users';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(200).json(results);
  });
});

//delete a user
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM users WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  });
});

//update user
app.put('/api/users/:id', (req, res) => {
  const { first_name, last_name, email, phone_number, pan_number } = req.body;
  const { id } = req.params;

  const sql = `
    UPDATE users SET first_name = ?, last_name = ?, email = ?, phone_number = ?, pan_number = ?
    WHERE id = ?
  `;

  db.query(sql, [first_name, last_name, email, phone_number, pan_number, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  });
});


//bulk upload

app.post('/api/users/bulk', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Validate every row
    for (let row of data) {
      const { first_name, last_name, email, phone_number, pan_number } = row;

      if (!first_name || !last_name || !email || !phone_number || !pan_number) {
        return res.status(400).json({ message: 'Validation failed: Missing fields in one or more rows.' });
      }

      if (!/^\S+@\S+\.\S+$/.test(email) ||
          !/^\d{10}$/.test(phone_number) ||
          !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number)) {
        return res.status(400).json({ message: 'Validation failed: Invalid data in one or more rows.' });
      }
    }

    // If validation passes, insert all rows
    const values = data.map(row => [
      row.first_name,
      row.last_name,
      row.email,
      row.phone_number,
      row.pan_number
    ]);

    const sql = `
      INSERT INTO users (first_name, last_name, email, phone_number, pan_number)
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.status(200).json({ message: 'Bulk upload successful!' });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing file' });
  }
});


//generate xlsx file
app.get('/api/users/download-excel', (req, res) => {
  const sql = 'SELECT first_name, last_name, email, phone_number, pan_number FROM users';

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error while generating Excel' });
    }

    const worksheet = xlsx.utils.json_to_sheet(results);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=users_list.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  });
});





app.listen(5000, () => {
  console.log('✅ Server running on http://localhost:5000');
});
