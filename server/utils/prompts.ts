// Prompts adapted from the Python implementation
export const QUESTION_GENERATION_PROMPT = `Based on the following research query, generate 5 specific follow-up questions 
that would help gather more comprehensive information for compound research.
The questions should explore different aspects of the topic and help elicit detailed information.

Research Query: {query}

Format your response as a JSON array of 5 questions only. No preamble or explanation.
Example: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

export const ANSWER_QUESTION_PROMPT = `You are a knowledgeable research assistant. Please answer the following question
based on the context of this research query: "{query}"

Question: {question}

Provide a factual answer with relevant information. Include sources or data if available.
VERY IMPORTANT: When citing sources, include hyperlinks to those sources in your answer.
Use the format [Source Name](URL) for all citations.
Focus on accuracy and relevance to the research topic.`;

export const RESEARCH_DATA_GATHERING_PROMPT = `You are a research assistant tasked with gathering detailed research data.
I need you to search for information related to this research query and the follow-up questions.

Research Query: {query}

Additional Information:
{qa_context}

Gather comprehensive research data with these requirements:
1. Search for relevant facts, statistics, and information
2. Find authoritative sources for each piece of information
3. VERY IMPORTANT: Include HYPERLINKED citations for ALL information using markdown format: [Source Name](URL)
4. Gather diverse perspectives on the topic
5. Focus on recent and reliable information
6. Structure information clearly with headings when appropriate

For EACH piece of information, follow this pattern:
- State the fact or information clearly
- Provide the source with a hyperlink: [Source Name](URL)
- Add brief context about why this information is relevant

Format your response in clear sections based on different aspects of the topic.`;

export const REPORT_TITLE_GENERATION_PROMPT = `You are tasked with creating a compelling, descriptive title for a comprehensive research report.

Research Query: {query}

Research Information:
{research_data}

Create a professional, academic-style title that:
1. Is concise but descriptive (7-12 words)
2. Accurately captures the essence of the research topic
3. Is engaging and would appeal to readers interested in this subject
4. Follows academic title conventions
5. Avoids clickbait or sensationalism

Return ONLY the title text, with no quotes, prefixes, or explanations.`;

export const RESEARCH_OUTLINE_PROMPT = `You are tasked with creating a well-structured outline for a comprehensive research report.

Based on the following information:

Research Query: {query}

Follow-up Questions and Answers:
{qa_context}

Research Data:
{research_data}

Create a detailed outline with 5-7 main sections that cover different aspects of the topic.

Format your outline using markdown with clear hierarchical structure:
- Use ## for main sections
- Use ### for subsections if needed

Each section should have a descriptive title that accurately reflects its content.
Include a brief (1-2 sentences) description of what each section will cover.

The outline should be logical, well-organized, and comprehensive.

IMPORTANT: DO NOT include "Executive Summary" or "Conclusion" sections - these will be added separately.
Focus only on the main content sections of the report.`;

export const SECTION_CONTENT_GENERATION_PROMPT = `You are writing a section of a comprehensive research report.

Research Query: {query}

Previous Content Generated:
{previous_content}

Section to Write: {section_title}

Follow-up Questions and Answers:
{qa_context}

Research Data:
{research_data}

Write 3-4 well-crafted paragraphs for this section that:
1. Are directly relevant to the section title
2. Include factual information with HYPERLINKED CITATIONS using markdown format: [Source Name](URL)
3. Provide meaningful analysis and insights
4. Avoid repeating information that appears in previous content
5. Are well-structured and flow logically
6. Use academic, professional language

IMPORTANT REQUIREMENTS:
- Include at least 3 specific citations to sources, using hyperlinks in markdown format: [Source Name](URL)
- Draw from the research data provided, but formulate your own insights
- Each paragraph should be substantial (5-7 sentences) and develop a clear point
- DO NOT repeat information from previous sections; provide new perspectives and details
- DO NOT include the section heading in your content; it will be added separately
- Use subheadings if appropriate to organize the content
- End with a smooth transition to the next section

Format your response using proper markdown, with clear paragraph breaks.`;

export const EXECUTIVE_SUMMARY_PROMPT = `You are tasked with writing an executive summary for a comprehensive research report.

Research Query: {query}

Based on the following full report:

{report_content}

Write a concise executive summary that:
1. Is approximately 2-3 paragraphs in length
2. Captures the key findings and insights from the full report
3. Mentions the major conclusions without detailed citations
4. Provides a high-level overview that would help a busy reader understand the core message
5. Uses clear, professional language

Format your response using markdown. DO NOT include a heading like "Executive Summary" in your response;
the heading will be added separately.`;

export const CONCLUSION_PROMPT = `You are tasked with writing the conclusion for a comprehensive research report.

Research Query: {query}

Based on the following full report:

{report_content}

Write a thoughtful conclusion that:
1. Is approximately 2-3 paragraphs in length
2. Summarizes the key findings and insights from the report
3. Discusses broader implications of the research
4. Identifies any limitations of the current research
5. Suggests potential areas for future research
6. Ends with a compelling final thought that gives closure to the report

Format your response using markdown. DO NOT include a heading like "Conclusion" in your response;
the heading will be added separately.`;
