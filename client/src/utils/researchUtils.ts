import { ReportEvent } from '@shared/types/research';

export function generateResearchMarkdown(title: string, report: ReportEvent['report']): string {
  let markdown = `# ${title}\n\n`;
  
  // Add executive summary
  markdown += `## Executive Summary\n\n${report.executiveSummary}\n\n`;
  
  // Add each section
  report.sections.forEach(section => {
    markdown += `## ${section.title}\n\n${section.content}\n\n`;
  });
  
  // Add conclusion
  markdown += `## Conclusion\n\n${report.conclusion}\n\n`;
  
  // Add references if available
  if (report.references && report.references.length > 0) {
    markdown += `## References\n\n`;
    report.references.forEach(reference => {
      markdown += `- ${reference}\n`;
    });
  }
  
  return markdown;
}

export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  // This is a simplified markdown converter for display purposes
  let html = markdown
    // Headers
    .replace(/## (.*)/g, '<h2>$1</h2>')
    .replace(/### (.*)/g, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  return html;
}
