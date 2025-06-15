import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { StuffDocumentsChain } from "langchain/chains";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";

async function main() {
  const loader = new TextLoader("data.txt");
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20,
  });
  const chunks = await splitter.splitDocuments(docs);

  const empeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(chunks, empeddings);

  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.5,
  });

  const prompt = ChatPromptTemplate.fromTemplate(`
	Answer the user's question based ONLY on the following context:
	<context>
	{context}
	</context>
	Question: {input}
      `);

  const combineDocsChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  const retriever = vectorStore.asRetriever({ k: 8 });

  const retrieverChain = await createRetrievalChain({
    retriever,
    combineDocsChain,
  });

  const result = await retrieverChain.invoke({
    input: "สรุปเนื้อหาทั้งหมด และ ข้อคิด",
  });

  console.log(result);
}

await main();
