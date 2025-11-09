// Simple multi-file bundler for preview - inline concatenation approach

export function bundleMultiFileProject(files: Map<string, string>): { code: string; css: string } {
  // Find main entry and order files
  const mainPath = Array.from(files.keys()).find(p => p.includes('App.tsx')) || Array.from(files.keys())[0];
  const componentFiles = Array.from(files.keys()).filter(p => p !== mainPath && p.includes('components'));
  const otherFiles = Array.from(files.keys()).filter(p => p !== mainPath && !p.includes('components'));
  
  const orderedPaths = [...componentFiles, ...otherFiles, mainPath].filter(p => !p.endsWith('.css'));
  
  console.log('Bundle order:', orderedPaths);
  console.log('All files:', Array.from(files.entries()).map(([k, v]) => ({ path: k, length: v.length })));
  
  // Extract CSS
  let cssContent = '';
  for (const [path, content] of files.entries()) {
    if (path.endsWith('.css')) {
      cssContent += `/* From: ${path} */\n${content}\n\n`;
    }
  }
  
  // Bundle JS/TSX files
  const externalDefaultIdentifiers = new Set<string>();
  const externalNamedIdentifiers = new Set<string>();
  const externalNamespaceIdentifiers = new Set<string>();
  const allowedExternalModules = new Set(['react', 'react-dom']);

  let bundled = '';
  for (const path of orderedPaths) {
    const content = files.get(path) || '';
    const lines = content.split('\n');
    const keptLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import')) {
        const fromMatch = trimmed.match(/import\s+(.+?)\s+from\s+['"]([^'"]+)['"];?$/);
        const bareImportMatch = trimmed.match(/import\s+['"]([^'"]+)['"];?$/);
        if (fromMatch) {
          const specifiers = fromMatch[1].trim();
          const source = fromMatch[2].trim();
          const isExternal = !source.startsWith('.') && !source.startsWith('/');
          
          if (isExternal && !allowedExternalModules.has(source)) {
            parseImportSpecifiers(specifiers, externalDefaultIdentifiers, externalNamedIdentifiers, externalNamespaceIdentifiers);
            continue;
          }
          // Internal import: skip line - files are concatenated together.
          continue;
        } else if (bareImportMatch) {
          const source = bareImportMatch[1].trim();
          const isExternal = !source.startsWith('.') && !source.startsWith('/');
          if (isExternal && !allowedExternalModules.has(source)) {
            continue;
          }
          continue;
        } else {
          continue;
        }
      }
      keptLines.push(line);
    }

    let transformed = keptLines.join('\n');
    
    // Remove exports but keep declarations
    transformed = transformed.replace(/export\s+default\s+function\s+/g, 'function ');
    transformed = transformed.replace(/export\s+function\s+/g, 'function ');
    transformed = transformed.replace(/export\s+const\s+/g, 'const ');
    transformed = transformed.replace(/export\s+default\s+/g, '');
    transformed = transformed.replace(/export\s+{[^}]+};?\n?/g, '');
    transformed = transformed.replace(/export\s+/g, '');
    
    bundled += `\n// From: ${path}\n${transformed}\n`;
  }
  
  console.log('Bundled code length:', bundled.length, 'CSS length:', cssContent.length);
  
  const stubCode = buildExternalImportStubs(externalDefaultIdentifiers, externalNamedIdentifiers, externalNamespaceIdentifiers);
  return { code: stubCode + bundled, css: cssContent };
}

export function generatePreviewHTML(files: Map<string, string>): string {
  if (files.size === 0) {
    return '<div>No files</div>';
  }
  const bundle = bundleMultiFileProject(files);
  return buildPreviewHTML(bundle.code, bundle.css);
}

function buildPreviewHTML(code: string, css: string): string {
  const jsonCode = JSON.stringify(code);
  const jsonCss = JSON.stringify(css);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'self' 'unsafe-inline';">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style id="__preview-base-style__">
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #000; }
    #root { width: 100%; min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    (function() {
      const css = ${jsonCss};
      if (css && css.trim().length > 0) {
        const styleTag = document.createElement('style');
        styleTag.id = '__preview-user-style__';
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
      }
    })();
  </script>
  <script>
    (function() {
      const showError = (error) => {
        console.error('Preview error:', error);
        document.body.innerHTML = '<div style="padding:2rem;font-family:monospace;background:#1f1b2e;color:#ff4d4f;"><h2 style="margin-bottom:1rem;">⚠️ Preview Error</h2><pre style="white-space:pre-wrap;word-break:break-word;background:rgba(0,0,0,0.4);border-radius:8px;padding:1rem;">' + (error && error.stack ? error.stack : (error && error.message ? error.message : String(error))) + '</pre></div>';
      };

      window.addEventListener('error', (event) => {
        event.preventDefault();
        const error = event.error || new Error(event.message);
        showError(error);
        // Send error to parent
        try {
          window.parent.postMessage({
            type: 'preview-error',
            error: error.message,
            stack: error.stack || event.message
          }, '*');
        } catch (e) {}
      });

      window.addEventListener('unhandledrejection', (event) => {
        event.preventDefault();
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        showError(error);
        // Send error to parent
        try {
          window.parent.postMessage({
            type: 'preview-error',
            error: error.message,
            stack: error.stack
          }, '*');
        } catch (e) {}
      });

      try {
        const code = ${jsonCode};
        console.log('Preview: Transforming code, length:', code.length);
        
        let transformed;
        try {
          transformed = Babel.transform(code, {
            presets: ['typescript', 'react'],
            sourceType: 'module',
            filename: 'preview.tsx'
          }).code;
          console.log('Preview: Transformation complete, transformed length:', transformed.length);
        } catch (babelError) {
          const babelErr = babelError instanceof Error ? babelError : new Error(String(babelError));
          console.error('Preview: Babel compilation error:', babelErr);
          // Send Babel error to parent
          try {
            window.parent.postMessage({
              type: 'preview-error',
              error: babelErr.message,
              stack: babelErr.stack
            }, '*');
          } catch (e) {}
          throw babelErr;
        }

        const exportsObj = {};
        const moduleObj = { exports: exportsObj };
        const require = (name) => {
          if (name === 'react') return React;
          if (name === 'react-dom') return ReactDOM;
          throw new Error('Preview cannot import module: ' + name);
        };

        // Execute transformed code in isolated scope
        const functionBody = [
          'const { useState, useEffect, useRef, useMemo, useCallback, useContext } = React;',
          transformed,
          'const candidates = [',
          "  typeof App !== 'undefined' ? App : null,",
          "  typeof Dashboard !== 'undefined' ? Dashboard : null,",
          "  typeof Main !== 'undefined' ? Main : null,",
          "  typeof Root !== 'undefined' ? Root : null,",
          "  typeof Component !== 'undefined' ? Component : null,",
          '  module.exports && module.exports.default ? module.exports.default : null,',
          '  exports && exports.default ? exports.default : null',
          '].filter(Boolean);',
          'return candidates.length > 0 ? candidates[0] : null;'
        ].join('\\n');
        
        console.log('Preview: Creating execution function, body length:', functionBody.length);
        const executeCode = new Function('React', 'ReactDOM', 'exports', 'module', 'require', functionBody);
        console.log('Preview: Executing code...');
        const component = executeCode(React, ReactDOM, exportsObj, moduleObj, require);
        console.log('Preview: Component found:', component ? component.name || 'Anonymous' : 'null');
        if (!component) {
          throw new Error('No component found. Make sure you define and export a main component like App or Dashboard.');
        }

        const rootElement = document.getElementById('root');
        if (!rootElement) {
          throw new Error('Root element not found');
        }
        const root = ReactDOM.createRoot(rootElement);
        console.log('Preview: Rendering component...');
        root.render(React.createElement(component));
        console.log('Preview: Render complete!');
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        showError(errorObj);
        // Send error to parent window for error detection
        try {
          window.parent.postMessage({
            type: 'preview-error',
            error: errorObj.message,
            stack: errorObj.stack
          }, '*');
        } catch (e) {
          // Ignore postMessage errors
        }
      }
    })();
  </script>
</body>
</html>`;
}
 
function parseImportSpecifiers(
  specifiers: string,
  defaultIds: Set<string>,
  namedIds: Set<string>,
  namespaceIds: Set<string>
) {
  let remaining = specifiers.trim();
  if (!remaining) return;
  remaining = remaining.replace(/^type\s+/, '').trim();

  if (remaining.startsWith('{') && remaining.endsWith('}')) {
    const names = remaining.slice(1, -1).split(',').map(n => n.trim()).filter(Boolean);
    names.forEach(name => namedIds.add(name.replace(/^\w+\s+as\s+/, '').trim()));
    return;
  }

  if (remaining.startsWith('* as ')) {
    const ns = remaining.replace('* as ', '').trim();
    if (ns) namespaceIds.add(ns);
    return;
  }

  const parts = remaining.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 1) {
    if (parts[0].startsWith('{') && parts[0].endsWith('}')) {
      const names = parts[0].slice(1, -1).split(',').map(n => n.trim()).filter(Boolean);
      names.forEach(name => namedIds.add(name.replace(/^\w+\s+as\s+/, '').trim()));
    } else {
      defaultIds.add(parts[0]);
    }
    return;
  }

  if (parts.length >= 2) {
    defaultIds.add(parts[0]);
    const namedPart = parts.slice(1).join(',').trim();
    if (namedPart.startsWith('{') && namedPart.endsWith('}')) {
      const names = namedPart.slice(1, -1).split(',').map(n => n.trim()).filter(Boolean);
      names.forEach(name => namedIds.add(name.replace(/^\w+\s+as\s+/, '').trim()));
    }
  }
}

function buildExternalImportStubs(
  defaultIds: Set<string>,
  namedIds: Set<string>,
  namespaceIds: Set<string>
): string {
  if (!defaultIds.size && !namedIds.size && !namespaceIds.size) {
    return '';
  }

  let code = `
// ---- Preview stubs for unsupported external modules ----
const __PreviewStubComponent = (label) => Object.assign(
  (...args) => React.createElement(
    'div',
    {
      style: {
        padding: '16px',
        border: '1px dashed rgba(211, 47, 47, 0.4)',
        borderRadius: '12px',
        background: 'rgba(211, 47, 47, 0.08)',
        color: '#d32f2f',
        margin: '12px 0',
        fontFamily: 'monospace',
        fontSize: '14px',
        textAlign: 'center'
      }
    },
    label + ' unavailable in preview'
  ),
  { displayName: label }
);
const __PreviewStubNamespace = (label) =>
  new Proxy({}, { get: () => __PreviewStubComponent(label) });
`;

  defaultIds.forEach(id => {
    code += `const ${id} = __PreviewStubComponent('${id}');\n`;
  });

  namedIds.forEach(id => {
    code += `const ${id} = __PreviewStubComponent('${id}');\n`;
  });

  namespaceIds.forEach(id => {
    code += `const ${id} = __PreviewStubNamespace('${id}');\n`;
  });

  code += '// -----------------------------------------------------\n\n';
  return code;
}
