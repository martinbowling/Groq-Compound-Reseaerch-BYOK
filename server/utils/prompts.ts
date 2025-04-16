// Prompts adapted from the Python implementation
export const QUESTION_GENERATION_PROMPT = `
Given a research query, generate 5 specific follow-up questions that would help in creating a comprehensive research report on the topic. 
The questions should:
1. Cover different aspects of the topic
2. Be specific and focused (not too broad)
3. Be formulated to elicit detailed responses
4. Help gather information for a structured research report
5. Be directly relevant to the main query

Research Query: {query}

Generate 5 follow-up questions in a numbered list format:`;

export const ANSWER_QUESTION_PROMPT = `
You are a knowledgeable research assistant. Please provide a detailed, accurate answer to the following question related to a research topic. 
Include specific facts, data, and references where appropriate. Be comprehensive but concise.

Research Topic: {query}
Question: {question}

Your answer should:
- Be factually accurate and informative
- Include relevant examples, statistics, or case studies if applicable
- Cite sources or reference authoritative information
- Be around 200-300 words in length
- Be written in a clear, professional tone

Your detailed answer:`;

export const RESEARCH_DATA_GATHERING_PROMPT = `
Given a research query and related questions and answers, compile comprehensive research data that will serve as the foundation for a detailed report. 
Focus on gathering factual information, statistics, expert opinions, relevant studies, and diverse perspectives on the topic.

Research Query: {query}

Questions and Answers:
{qa_context}

Your task is to:
1. Extract and organize the key information from the Q&A
2. Add additional relevant facts and context where needed
3. Ensure the data is accurate and well-sourced
4. Include conflicting viewpoints or debates within the field
5. Provide specific examples, case studies, or statistics
6. Organize the information in a logical manner

The research data should be comprehensive and well-structured, serving as the basis for creating a detailed report on the topic.

Compiled Research Data:`;

export const REPORT_TITLE_GENERATION_PROMPT = `
Create a professional, concise, and engaging title for a comprehensive research report on the following topic. The title should be informative, 
reflect the scope and focus of the research, and appeal to an academic or professional audience.

Research Topic: {query}

Research Data Overview:
{research_data}

Requirements for the title:
- Between 5-15 words
- Clearly convey the subject matter
- Be specific rather than overly general
- Avoid unnecessary jargon or buzzwords
- Be formal and professional in tone
- Not use phrases like "A Study on" or "Research into"

Generate only the title text, without any quotation marks or formatting:`;

export const RESEARCH_OUTLINE_PROMPT = `
Create a detailed outline for a comprehensive research report on the following topic. The outline should provide a logical structure for organizing 
the research findings into coherent sections and subsections.

Research Topic: {query}
Research Title: {title}

Questions Explored:
{questions}

Research Data:
{research_data}

Your outline should:
1. Include an Executive Summary section
2. Have a clear Introduction section
3. Organize the main body into 3-7 logical sections with appropriate headings
4. Include relevant subsections where needed
5. End with a Conclusion section
6. Optionally include sections for References or Appendices

Format the outline with clear hierarchical numbering for sections and subsections.

Outline:`;

export const SECTION_CONTENT_GENERATION_PROMPT = `
Write detailed content for the following section of a research report. The content should be comprehensive, informative, and directly relevant to the section's topic.

Research Topic: {query}
Section Title: {section_title}

Previous Content (for context):
{previous_content}

Research Data:
{research_data}

Question-Answer Context:
{qa_context}

Your task is to:
1. Write comprehensive content for this section
2. Incorporate relevant information from the research data
3. Ensure logical flow and coherence with previous sections
4. Include specific examples, data, or evidence where appropriate
5. Maintain a formal, academic tone
6. Use proper citations or references when including specific facts or claims
7. Be thorough yet concise (aim for approximately 400-600 words for this section)

Section Content:`;

export const EXECUTIVE_SUMMARY_PROMPT = `
Create a concise executive summary for a research report on the following topic. The summary should provide a complete overview of the report's key findings, 
implications, and conclusions in a condensed format.

Research Topic: {query}
Report Content:
{report_content}

Your executive summary should:
1. Be approximately 200-300 words in length
2. Highlight the main purpose of the research
3. Summarize key findings from each major section
4. Mention important conclusions or recommendations
5. Be written in a clear, direct style accessible to both experts and non-experts
6. Avoid introducing new information not covered in the report
7. Be self-contained (readers should understand the core message without reading the full report)

Executive Summary:`;

export const CONCLUSION_PROMPT = `
Write a thoughtful conclusion for a research report on the following topic. The conclusion should effectively synthesize the report's findings, 
discuss implications, and suggest future directions.

Research Topic: {query}
Report Content:
{report_content}

Your conclusion should:
1. Summarize the key findings discussed throughout the report
2. Analyze the significance and broader implications of these findings
3. Address any limitations of the current research
4. Suggest potential areas for future research or development
5. Provide closing thoughts that leave a lasting impression on the reader
6. Be approximately 300-400 words in length
7. Maintain a formal, academic tone while being accessible

Conclusion:`;
