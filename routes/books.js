const express = require('express');
const router = express.Router();
const fs = require('fs');

// import the required models
const Author = require('../models/Author');
const Book = require('../models/Book');

// everything for uploading file
// const multer = require('multer');
// const path = require('path');
// const uploadPath = path.join('public', Book.coverImageBasePath);
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
// const upload = multer({
//     dest: uploadPath,
//     fileFilter: (req, file, callback) => {
//         callback(null, imageMimeTypes.includes(file.mimetype));
//     }
// });

// GET ALL BOOKS
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

// FORM TO CREATE NEW BOOK
router.get('/new', async (req, res) => {
   renderNewPage(res, new Book());
});

// CREATE A NEW BOOK
router.post('/', async (req, res) => {
    // const fileName = req.file != null ? req.file.filename : null;
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        // coverImageName: fileName,
        description: req.body.description
    });

    saveCover(book, req.body.cover);

    try {
        const newBook = await book.save();
        res.redirect(`books/${newBook.id}`);
    }
    catch {
        // if (book.coverImageName != null) {
        //     removeBookCover(book.coverImageName);
        // }
        renderNewPage(res, book, true);
    }
});

// GET A SPECIFIC BOOK
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
                                .populate('author')
                                .exec();
        res.render('books/show', {book: book});
    }
    catch {
        res.redirect('/');
    }
});

// FORM TO EDIT BOOK
router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        renderEditPage(res, book);
    }
    catch {
        res.redirect('/');
    }
});

// UPDATE A BOOK
router.put('/:id', async (req, res) => {
    let book;
    
    try {
       book = await Book.findById(req.params.id);
       book.title = req.body.title;
       book.author = req.body.author;
       book.publishDate = new Date(req.body.publishDate);
       book.pageCount = req.body.pageCount;
       book.description = req.body.description;
       if (req.body.cover != null && req.body.cover !== '') {
           saveCover(book, req.body.cover);
       }
       await book.save();
       res.redirect(`/books/${book.id}`);
    }
    catch {
        if (book != null) {
            renderEditPage(res, book, true);
        }
        else {
            res.redirect('/');
        }
    }
});

// DELETE A BOOK
router.delete('/:id', async (req, res) => {
    let book;
    try {
        book = await Book.findById(req.params.id);
        await book.remove();
        res.redirect('/books');
    }
    catch {
        if (book != null) {
            res.render('books/show', {
                book: book, 
                errorMessage: "could not remove book"
            });
        }
        else {
            res.redirect('/');
        }
    }
});

// function removeBookCover(fileName) {
//     fs.unlink(path.join(uploadPath, fileName), (err) => {
//         if (err) {
//             console.error(err);
//         }
//     })
// }

async function renderNewPage(res, book, hasError = false) {
    renderFormPage(res, book, 'new', hasError);
}

async function renderEditPage(res, book, hasError = false) {
    renderFormPage(res, book, 'edit', hasError);
}

async function renderFormPage(res, book, form, hasError = false) {
    try {
        const authors = await Author.find({});
        const params = {
            authors: authors,
            book: book
        }

        if (hasError) {
            if (form === 'edit') {
                params.errorMessage = 'error updating book'
            }
            else {
                params.errorMessage = "error creating book";
            }
        }

        res.render(`books/${form}`, params);
    }
    catch {
        res.redirect('/books');
    }
}

function saveCover(book, coverEncoded) {
    if (coverEncoded == null) {
        return
    }

    const cover = JSON.parse(coverEncoded);

    if (cover != null && imageMimeTypes.includes(cover.type)) {
        book.coverImage = new Buffer.from(cover.data, 'base64');
        book.coverImageType = cover.type;
    }
}

module.exports = router;