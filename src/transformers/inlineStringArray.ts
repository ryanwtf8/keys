import * as t from '@babel/types';
import generate from '@babel/generator';

const gen = (node: any) => {
    return generate(node, { compact: true }).code;
};

function safeValueToNode(value: any) {
    if (value === undefined) return t.identifier("undefined");
    try {
        return t.valueToNode(value);
    } catch (e) {
        return null;
    }
}

export const inlineStringArray = {
  visitor: {
    Program: {
      enter(path: any, state: any) {
        state.arrayInfo = null;
        state.pathsToRemove = new Set();
        console.log("[INLINE-STR] Starting final inlining pass...");
      },
      exit(path: any, state: any) {
        if (state.pathsToRemove.size > 0) {
            console.log(`[INLINE-STR] Cleanup: Removing ${state.pathsToRemove.size} original array definitions.`);
            Array.from(state.pathsToRemove).reverse().forEach((p: any) => {
                if (p && !p.removed) {
                    try { p.remove(); } catch (e) { }
                }
            });
        }
      }
    },

    AssignmentExpression(path: any, state: any) {
      if (state.arrayInfo) return;

      const right = path.get('right');
      if (!right.isCallExpression() || !right.get('callee').isFunctionExpression()) {
        return;
      }

      const iifePath = right.get('callee');
      iifePath.traverse({
        ArrayExpression(arrayPath: any) {
          const parentMemberExpr = arrayPath.parentPath;
          if (!parentMemberExpr.isMemberExpression({ object: arrayPath.node })) return;

          const grandParentReturn = parentMemberExpr.parentPath;
          if (!grandParentReturn.isReturnStatement({ argument: parentMemberExpr.node })) return;

          const accessorFunc = grandParentReturn.findParent((p: any) => p.isFunctionExpression());
          if (!accessorFunc) return;
          
          const objectProp = accessorFunc.findParent((p: any) => p.isObjectProperty({ value: accessorFunc.node }));
          if (!objectProp) return;

          const evalResults = arrayPath.get("elements").map((el: any) => el.evaluate());
          if (!evalResults.every((r: any) => r.confident)) {
            return;
          }
          const theArray = evalResults.map((r: any) => r.value);
          
          const objectName = gen(path.node.left);
          const accessorName = objectProp.get("key").isIdentifier() ? objectProp.get("key").node.name : objectProp.get("key").node.value;
          
          state.arrayInfo = { objectName, accessorName, theArray };
          state.pathsToRemove.add(path.getStatementParent());

          console.log(`\n[INLINE-STR] Successfully parsed literal array!`);
          console.log(`[INLINE-STR] - Object Name:   '${objectName}'`);
          console.log(`[INLINE-STR] - Accessor Name: '${accessorName}'`);
          console.log(`[INLINE-STR] - Array Size:    ${theArray.length}\n`);
        }
      });
    },

    CallExpression(path: any, state: any) {
      if (!state.arrayInfo) return;

      const callee = path.get('callee');
      if (!callee.isMemberExpression()) return;

      const { objectName, accessorName, theArray } = state.arrayInfo;

      if (gen(callee.node.object) === objectName && callee.get('property').isIdentifier({ name: accessorName })) {
        
        const evaluation = path.get('arguments.0').evaluate();

        if (evaluation.confident && typeof evaluation.value === 'number') {
          const index = evaluation.value;
          
          if (index >= 0 && index < theArray.length) {
            const resolvedValue = theArray[index];
            const replacementNode = safeValueToNode(resolvedValue);

            if (replacementNode) {
                console.log(`[INLINE-STR] Inlining ${gen(path.node)} -> ${gen(replacementNode)}`);
                path.replaceWith(replacementNode);
            } else {
                console.warn(`[INLINE-STR] Could not create a literal node for value at index ${index}.`);
            }
          } else {
            console.warn(`[INLINE-STR] Index ${index} is out of bounds.`);
          }
        } else {
          console.warn(`[INLINE-STR] Could not statically resolve index for call: ${gen(path.node)}`);
        }
      }
    }
  }
};
