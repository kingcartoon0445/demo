import { Block, EmailTemplate } from './schema';

export function generateHTML(template: EmailTemplate): string {
  const { blocks, globalStyles } = template;
  
  const generateBlockHTML = (block: Block): string => {
    const { type, content, styles, children, href, src, alt } = block;
    
    const styleString = styles ? Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ') : '';

    switch (type) {
      case 'text':
        return `<div style="${styleString}">${content || ''}</div>`;
      
      case 'image':
        return `<img src="${src || '/placeholder-image.svg'}" alt="${alt || 'Image'}" style="${styleString}" />`;
      
      case 'button':
        const buttonContent = `<a href="${href || '#'}" style="${styleString}">${content || 'Button'}</a>`;
        return `<div style="text-align: center;">${buttonContent}</div>`;
      
      case 'divider':
        return `<hr style="${styleString}" />`;
      
      case 'spacer':
        return `<div style="${styleString}"></div>`;
      
      case 'container':
        const containerChildren = children?.map(generateBlockHTML).join('') || '';
        return `<div style="${styleString}">${containerChildren}</div>`;
      
      case 'row':
        const rowChildren = children?.map(generateBlockHTML).join('') || '';
        return `<div style="${styleString}">${rowChildren}</div>`;
      
      case 'column':
        const columnChildren = children?.map(generateBlockHTML).join('') || '';
        return `<div style="${styleString}">${columnChildren}</div>`;
      
      default:
        return '';
    }
  };

  const blocksHTML = blocks.map(generateBlockHTML).join('');
  
  const globalStyleString = globalStyles ? Object.entries(globalStyles)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
    .join('; ') : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.subject}</title>
  <style>
    body { margin: 0; padding: 0; ${globalStyleString} }
    table { border-collapse: collapse; width: 100%; }
    .email-container { max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="email-container">
    ${blocksHTML}
  </div>
</body>
</html>`.trim();
}

export function generatePreviewHTML(template: EmailTemplate): string {
  const { blocks, globalStyles } = template;
  
  const generateBlockHTML = (block: Block): string => {
    const { type, content, styles, children, href, src, alt } = block;
    
    const styleString = styles ? Object.entries(styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ') : '';

    switch (type) {
      case 'text':
        return `<div style="${styleString}">${content || ''}</div>`;
      
      case 'image':
        return `<img src="${src || '/placeholder-image.svg'}" alt="${alt || 'Image'}" style="${styleString}" />`;
      
      case 'button':
        const buttonContent = `<a href="${href || '#'}" style="${styleString}">${content || 'Button'}</a>`;
        return `<div style="text-align: center;">${buttonContent}</div>`;
      
      case 'divider':
        return `<hr style="${styleString}" />`;
      
      case 'spacer':
        return `<div style="${styleString}"></div>`;
      
      case 'container':
        const containerChildren = children?.map(generateBlockHTML).join('') || '';
        return `<div style="${styleString}">${containerChildren}</div>`;
      
      case 'row':
        const rowChildren = children?.map(generateBlockHTML).join('') || '';
        return `<div style="${styleString}">${rowChildren}</div>`;
      
      case 'column':
        const columnChildren = children?.map(generateBlockHTML).join('') || '';
        return `<div style="${styleString}">${columnChildren}</div>`;
      
      default:
        return '';
    }
  };

  const blocksHTML = blocks.map(generateBlockHTML).join('');
  
  return blocksHTML;
}
