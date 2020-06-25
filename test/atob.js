var str = "Ny8xNA0KUGFzc2FnZSAyN6GiUGFzc2FnZSA2N6GiUGFzc2FnZSA4MKGiUGFzc2FnZSAxMDeholBhc3NhZ2UgMTE1oaJQYXNzYWdlIDEyNaGiUGFzc2FnZSAxMjeholBhc3NhZ2UgMTU4oaJQYXNzYWdlIDE2OCwgNDQ=";


console.log(Buffer.from(str, 'base64').toString());
