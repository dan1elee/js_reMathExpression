const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

const code = `
function exampleFunction(srcValue) {
    return srcValue * 2 - 3;
}`;

const ast = esprima.parseScript(code);

let expression = null;

estraverse.traverse(ast, {
    enter: (node) => {
        if (node.type === 'ReturnStatement') {
            expression = node.argument;
        }
    }
});

if (expression) {
    console.log('Reverse function code:');
    console.log(`
function reverseFunction(output) {
    let srcValue = (${generateReverseExpression(expression, 'output')}); 
    return srcValue;
}
    `);
}

function generateReverseExpression(expression, outputVariable) {
//	console.log(outputVariable)
//	console.log(expression.type)
	if (expression.type === 'BinaryExpression') {
		const lefthas = containsVariable(expression.left, 'srcValue');
		const righthas = containsVariable(expression.right, 'srcValue');
		const left = escodegen.generate(expression.left);
        const right = escodegen.generate(expression.right);
		switch (expression.operator) {
            case '+':
				if (lefthas) {
					return `(${generateReverseExpression(expression.left, `(${outputVariable} - (${right}))`)})`;
				} else {	
					return `(${generateReverseExpression(expression.right, `(${outputVariable} - (${left}))`)})`;
				}
            case '-':
				if (lefthas) {
					return `(${generateReverseExpression(expression.left, `(${outputVariable} + ${right})`)})`;
				} else {	
					return `(${generateReverseExpression(expression.right, `(${left} - (${outputVariable}))`)})`;
				}
            case '*':
				if (lefthas) {
					return `(${generateReverseExpression(expression.left, `(${outputVariable} / (${right}))`)})`;
				} else {	
					return `(${generateReverseExpression(expression.right, `(${outputVariable} / (${left}))`)})`;
				}
            case '/':
				if (lefthas) {
					return `(${generateReverseExpression(expression.left, `(${outputVariable} * ${right})`)})`;
				} else {	
					return `(${generateReverseExpression(expression.right, `(${left} / (${outputVariable}))`)})`;
				}
        }
    } else if (expression.type === 'Identifier') {
        return outputVariable;
    } else if (expression.type === 'Literal') {
        return expression.value;
    }

    return 'undefined';
}

function containsVariable(node, variable) {
    if (node.type === 'Identifier' && node.name === variable) {
        return true;
    } else if (node.type === 'BinaryExpression') {
        return containsVariable(node.left, variable) || containsVariable(node.right, variable);
    }
    return false;
}
