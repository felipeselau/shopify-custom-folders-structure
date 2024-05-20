# Shopify Custom Folder Structure for theme editing

this project aims to allow the user to use a file structure different than the official shopify for theme editing and working with `liquid` template language, knowing that, in large projects, having just one folder for all your `assets`, one folder for all your `sections` and one for all your `snippets` can become quite a mess.

## How is the custom structure then?
### It goes something like this:
```
.
└── shopify-custom-folders/
    ├── README.md
    ├── index.js
    ├── src/
    │   ├── sections/
    │   │   └── header/
    │   │       ├── header.liquid
    │   │       ├── header.css
    │   │       └── header.js
    │   └── snippets
    └── Your-shopify-store-theme-folder/
        ├── assets/
        │   ├── section-header.css
        │   ├── section-header.js
        │   └── etc...
        ├── sections/
        │   └── section-header.liquid
        ├── snippets
        └── etc...
```
so the idea is basically to forget the store folder and it's mess while being able to work with the important files in an organized way

## Development Steps:
### What the project should do, the futures plans and etc
- copiar arquivos pastas sections e snippets pra pasta src/
- criar subpastas baseadas no nome dos arquivos
- adicionar assets correspondentes
- observar mudanças nas pastas `src` e refletir na origem
- observar mudanças na origem e refletir na pasta `src`

## How to Use?

- Clone your shopify theme repo into the root folder
- Add a `.env` file with a variable named `TARGET_FOLDER` and the value `your-shopify-theme-folder`