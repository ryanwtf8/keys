import * as t from '@babel/types';

export const resolveMappings = {
  visitor: {
    Program(path: any) {
      const mappings = new Map();
      
      path.traverse({
        CallExpression(callPath: any) {
          const { callee, arguments: args } = callPath.node;
          
          if (t.isIdentifier(callee) && (callee.name === 'M6J' || callee.name === 'f8D') && args.length >= 4) {
            const objArg = args[0];
            const methodArg = args[1];
            const aliasArg = args[3];
            
            if (t.isStringLiteral(methodArg) && t.isStringLiteral(aliasArg)) {
              const method = methodArg.value;
              const alias = aliasArg.value;
              let baseObj = null;
              if (t.isIdentifier(objArg)) {
                const globalMappings: Record<string, string> = {
                  'k2K': 'String',
                  'z4k': 'window',
                  'R9p': 'Math',
                  'c5G': 'Array',
                  'h1G': 'RegExp'
                };
                baseObj = globalMappings[objArg.name] || objArg.name;
              }
              
              if (baseObj && method) {
                const isWindowFunction = baseObj === 'window' || 
                  ['atob', 'btoa', 'parseInt', 'parseFloat', 'isNaN', 'isFinite'].includes(method);
                let fullPath: string;
                let actualBase = isWindowFunction ? 'window' : baseObj;
                
                if (isWindowFunction) {
                  fullPath = method;
                } else {
                  fullPath = `${baseObj}.${method}`;
                }
                mappings.set(alias, { base: actualBase, method, fullPath });
                console.log(`[RESOLVE-MAP] Found mapping: i.${alias} -> ${fullPath}`);
              }
            }
          }
        }
      });

      if (mappings.size === 0) {
        console.log('[RESOLVE-MAP] No mappings found.');
        return;
      }

      console.log(`[RESOLVE-MAP] Found ${mappings.size} mappings. Resolving...`);
      path.traverse({
        MemberExpression(memberPath: any) {
          const { object, property } = memberPath.node;
          if (t.isIdentifier(object) && object.name === 'i' && 
              t.isIdentifier(property) && mappings.has(property.name)) {
            
            const mapping = mappings.get(property.name);
            const parent = memberPath.parent;
            if (t.isCallExpression(parent) && parent.callee === memberPath.node) {
              if (mapping.base === 'String' && mapping.method === 'fromCharCode') {
                const replacement = t.memberExpression(
                  t.identifier('String'),
                  t.identifier('fromCharCode')
                );
                memberPath.replaceWith(replacement);
                console.log(`[RESOLVE-MAP] Replaced i.${property.name}() -> String.fromCharCode()`);
              } else if (mapping.base === 'Math' && mapping.method === 'random') {
                const replacement = t.memberExpression(
                  t.identifier('Math'),
                  t.identifier('random')
                );
                memberPath.replaceWith(replacement);
                console.log(`[RESOLVE-MAP] Replaced i.${property.name}() -> Math.random()`);
              } else if (mapping.base === 'window') {
                memberPath.replaceWith(t.identifier(mapping.method));
                console.log(`[RESOLVE-MAP] Replaced i.${property.name} -> ${mapping.method}`);
              }
            }
          }
        },
        
        CallExpression(callPath: any) {
          const { callee } = callPath.node;
          
          if (t.isIdentifier(callee) && mappings.has(callee.name)) {
            const mapping = mappings.get(callee.name);
            
            if (mapping.base === 'window') {
              callPath.node.callee = t.identifier(mapping.method);
              console.log(`[RESOLVE-MAP] Replaced ${callee.name}() -> ${mapping.method}()`);
            }
          }
        }
      });

      console.log('[RESOLVE-MAP] Mapping resolution complete.');
    }
  }
};
