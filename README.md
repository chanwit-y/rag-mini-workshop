## 🚀 Building a RAG Pipeline with Bun & LangChain.js

Here's a step-by-step guide to creating a simple Retrieval-Augmented Generation (RAG) application using Bun, TypeScript, and LangChain.

### 1. Initialize Your Project

First, let's set up a new Bun project.

```sh
mkdir bun-rag-app
cd bun-rag-app

bun init # Select the "Blank" template
```

### 2. Install Dependencies 📦

Next, we'll install LangChain, which provides the core building blocks for our RAG pipeline.

```sh
bun add langchain
```

### 3. Load the Document 📄

Create a file named `data.txt` and add some text to it. Then, use the `TextLoader` to load this document into your application.

```ts
// index.ts
import { TextLoader } from "langchain/document_loaders/fs/text";

const loader = new TextLoader("data.txt");
const docs = await loader.load();

console.log(docs);
```

### 4. Chunk the Document 🔪

To make the document easier for the model to process, we'll split it into smaller, overlapping chunks using the `RecursiveCharacterTextSplitter`.
[[RecursiveCharacterTextSplitter]] [[Overlap]]

- **`chunkSize`**: The maximum size of each chunk.
    
- **`chunkOverlap`**: The number of characters that overlap between adjacent chunks to maintain context.
    

```ts
// index.ts
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const splitter = new RecursiveCharacterTextSplitter({
	chunkSize: 200,
	chunkOverlap: 20,
});
const chunks = await splitter.splitDocuments(docs);

console.log(chunks);
```

### 5. Initialize the Embedding Model 🧠

We need a model to convert our text chunks into numerical vectors (embeddings). We'll use OpenAI's embedding model for this.

```ts
// index.ts
import { OpenAIEmbeddings } from "@langchain/openai";

const embeddings = new OpenAIEmbeddings();
```

### 6. Create the Vector Store 💾

Now, we'll embed our chunks and store them in a `MemoryVectorStore`. This allows for efficient in-memory similarity searches.

```ts
// index.ts
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
```

### 7. Initialize the Language Model 🤖

Select the Large Language Model (LLM) that will generate the final answer. Here, we're using `gpt-4o-mini`.

```ts
// index.ts
import { ChatOpenAI } from "@langchain/openai";

const llm = new ChatOpenAI({
	model: "gpt-4o-mini",
	temperature: 0.5,
});
```

### 8. Create a Prompt Template 📝

This template guides the LLM, instructing it to answer the user's question based _only_ on the retrieved document chunks (the context).

```ts
// index.ts
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromTemplate(
	`Answer the user's question based ONLY on the following context:
	
	<context>
	{context}
	</context>
	
	Question: {input}`
);
```

### 9. Create the Document Chain 🔗

The `createStuffDocumentsChain` takes our documents and "stuffs" them directly into the context of the prompt.
[[createStuffDocumentsChain]]

```ts
// index.ts
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

const combineDocsChain = await createStuffDocumentsChain({ llm, prompt });
```

### 10. Create the Retriever & Full Chain 🔍

Finally, we'll tie everything together.

1. **Retriever**: The `retriever` fetches the most relevant document chunks from the vector store based on the user's question.
    
2. **Retrieval Chain**: The `createRetrievalChain` orchestrates the entire flow: it retrieves relevant documents and then passes them to the document chain to generate an answer.
    

```ts
// index.ts
import { createRetrievalChain } from "langchain/chains/retrieval";

const retriever = vectorStore.asRetriever({ k: 4 }); // Get top 4 results

const retrievalChain = await createRetrievalChain({
	retriever,
	combineDocsChain,
});
```

### 11. Run the Chain! ✨

Now you can invoke the chain with a question and get a context-aware answer.

```ts
// index.ts
const question = "What is the main topic of the document?";

const result = await retrievalChain.invoke({
	input: question,
});

console.log("Answer:", result.answer);
```