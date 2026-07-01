from app.schemas.knowledge import KnowledgeChunkItem


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[KnowledgeChunkItem]:
    if not text:
        return []

    def _word_split(text: str) -> list[str]:
        return text.split()

    paragraphs = text.split("\n\n")
    chunks: list[KnowledgeChunkItem] = []
    current_chunk: list[str] = []
    current_length = 0
    chunk_index = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        para_words = _word_split(para)
        para_len = len(para_words)

        if para_len > chunk_size:
            if current_chunk:
                chunk_text_str = " ".join(current_chunk)
                chunks.append(KnowledgeChunkItem(
                    index=chunk_index,
                    text=chunk_text_str,
                    token_count=current_length,
                ))
                chunk_index += 1
                current_chunk = []
                current_length = 0

            sub_chunks = chunk_text_fixed_size(para, chunk_size, overlap)
            for sc in sub_chunks:
                chunks.append(KnowledgeChunkItem(
                    index=chunk_index,
                    text=sc.text,
                    token_count=sc.token_count,
                ))
                chunk_index += 1
            continue

        if current_length + para_len > chunk_size and current_chunk:
            chunk_text_str = " ".join(current_chunk)
            chunks.append(KnowledgeChunkItem(
                index=chunk_index,
                text=chunk_text_str,
                token_count=current_length,
            ))
            chunk_index += 1

            overlap_text = current_chunk[-1:] if overlap > 0 else []
            current_chunk = overlap_text
            current_length = len(" ".join(overlap_text).split())

        current_chunk.append(para)
        current_length += para_len

    if current_chunk:
        chunk_text_str = " ".join(current_chunk)
        chunks.append(KnowledgeChunkItem(
            index=chunk_index,
            text=chunk_text_str,
            token_count=current_length,
        ))

    return chunks


def chunk_text_fixed_size(text: str, chunk_size: int = 500, overlap: int = 50) -> list[KnowledgeChunkItem]:
    if not text:
        return []

    words = text.split()
    chunks: list[KnowledgeChunkItem] = []
    start = 0
    chunk_index = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunks.append(KnowledgeChunkItem(
            index=chunk_index,
            text=" ".join(chunk_words),
            token_count=len(chunk_words),
        ))
        chunk_index += 1
        step = chunk_size - overlap
        if step <= 0:
            step = 1
        start += step

    return chunks
