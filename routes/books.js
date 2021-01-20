const express = require('express');
const router = express.Router();
const fs = require('fs');

// import the required models
const Author = require('../models/Author');
const Book = require('../models/Book');

// everything for uploading file
const multer = require('multer');
const path = require('path');
const uploadPath = path.join('public', Book.coverImageBasePath);
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype));
    }
});

// get all books
router.get('/', async (req, res) => {
    let query = Book.find();

    // get based on title
    if (req.query.title != null && req.query.title != '') {
        query = query.regex('title', new RegExp(req.query.title, 'i'));
    }

    // get based on before the given date
    if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
        query = query.lte('publishDate', req.query.publishedBefore);
    }

    // get based on after the given date
    if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
        query = query.gte('publishDate', req.query.publishedAfter);
    }

    try {
        const books = await query.exec();
        res.render('books/index', {
            books: books,
            searchOptions: req.query
        });
    }
    catch {
        res.redirect('/');
    }
});

// form to create a new book
router.get('/new', async (req, res) => {
   renderNewPage(res, new Book());
});

// create a new book
router.post('/', upload.single('cover'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    });

    try {
        const newBook = await book.save();
        // res.redirect(`books/${newBook.id}`);
        res.redirect('books');
    }
    catch {
        if (book.coverImageName != null) {
            removeBookCover(book.coverImageName);
        }
        renderNewPage(res, book, true);
    }
});

function removeBookCover(fileName) {
    fs.unlink(path.join(uploadPath, fileName), (err) => {
        if (err) {
            console.error(err);
        }
    })
}

async function renderNewPage(res, book, hasError = false) {
    try {
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book
        }

        if (hasError) {
            params.errorMessage = "error creating book";
        }

        res.render('books/new', params);
    }
    catch {
        res.redirect('/books');
    }
}

module.exports = router;