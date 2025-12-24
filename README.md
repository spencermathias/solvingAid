# Basic Website for Tokenizing and Manipulating Equations

This project is a basic web application that allows users to input mathematical equations, tokenize them, and manipulate the tokens in various ways. Users can drag tokens around, perform operations on the entire equation, and substitute variables with multiple terms.

## Project Structure

```
basic-website
├── src
│   ├── index.html        # Main HTML document for the website
│   ├── styles
│   │   └── style.css     # CSS styles for the website
│   ├── scripts
│   │   └── app.js        # JavaScript code for handling user input and operations
├── package.json           # Configuration file for npm
└── README.md              # Documentation for the project
```

## Features

- **Input Field**: Users can enter mathematical equations.
- **Tokenization**: The input is tokenized into manageable chunks.
- **Draggable Tokens**: Users can drag tokens from one side of the equals sign to the other.
- **Operations**: Users can perform addition, subtraction, multiplication, and division on the entire equation.
- **Variable Substitution**: Users can select multiple items to substitute for a variable and vice versa.
- **Term Expansion**: Users can select one variable and expand it into multiple terms from other equations or the input box.

## Getting Started

1. **Clone the Repository**:
   ```
   git clone <repository-url>
   cd basic-website
   ```

2. **Install Dependencies**:
   ```
   npm install
   ```

3. **Run the Application**:
   Open `src/index.html` in your web browser to view and interact with the application.

## Usage

- Enter a mathematical equation in the input field.
- Click the "Tokenize" button to see the equation broken down into chunks.
- Drag the tokens around to rearrange them as needed.
- Use the operation buttons to perform calculations on the entire equation.
- Select tokens to substitute them for variables or expand variables into multiple terms.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.