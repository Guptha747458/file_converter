const pdf = require('pdf-parse');
console.log('Type of pdf-parse:', typeof pdf);
console.log('Content of pdf-parse:', pdf);
if (typeof pdf === 'object' && pdf !== null) {
    console.log('Keys of pdf-parse:', Object.keys(pdf));
}
