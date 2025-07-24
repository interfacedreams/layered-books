export function getStyleGuidelines(contentType: string): string {
  return `Style guidelines for ${contentType}:
    - Act as if you are the author taking readable, clear notes on the text.
    - Use the text's voice and vocabulary
    - Use declarative language
    - Be direct and concise and keep it simple
    - NEVER use filler terms like 'this chapter', 'the chapter', 'this section', or 'the author'
    - Write complete sentences`
}

export function getAuthorStyleGuidelines(): string {
  return `Use declarative language. Avoid using phrases like 'the author' or 'this chapter'. Use the author's vocabulary and opinions. But ALWAYS write complete sentences. Each sentence must be short and direct. Each sentence must be a single idea. NEVER be vague or too general.`
}

export function keyPointStyleGuidelines(contentType: string): string {
  return `1 to 2 sentences representing a key point capturing the essence of this ${contentType}. If there are many different ideas, then choose the most important one. ${getAuthorStyleGuidelines()}`
}

export function getKeypointExamples(): string {
  return `Example 1:
Bad key point (too wordy and uses filler phrases like "this chapter"):
"This chapter addresses common misconceptions about the benefits of individual productivity in a private property system, using economic reasoning to show that individuals generally receive the value of what they produce."
Good key point:
"Individuals generally receive the value of what they produce."

Example 2:
Bad key point (too wordy and too many ideas in one sentence): 
"Contrary to Marxist predictions, historical capitalist societies have seen the poor get richer, the middle class expand, and the gap between rich and poor slowly close, with government interventions often hindering rather than helping this trend."
Good key point:
"Historical capitalist societies have seen the poor get richer, the middle class expand, and the gap between rich and poor slowly close."

Example 3:
Bad key point (too many ideas in one sentence - it should be split):
"A film is constructed by breaking down the protagonist's objective into beats, each represented by simple, uninflected shots, and the director's task is to design these beats to logically progress toward the story's resolution."
Good key point:
"A film is constructed by breaking down the protagonist's objective into beats, each represented by simple, uninflected shots. A director's task is to design these beats to logically progress toward the story's resolution."
`
}
