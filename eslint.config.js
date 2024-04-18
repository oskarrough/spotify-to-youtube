import jsdoc from "eslint-plugin-jsdoc"

export default {
    env: {
        "browser": true,
        "es2021": true
    },
    extends: "eslint:recommended",
    plugins: {
        jsdoc: jsdoc
    },
    parserOptions: {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    rules: { }
}
