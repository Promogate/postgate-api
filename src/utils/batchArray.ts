// @ts-nocheck

export async function* getAllPagedData(array, itemsPerPage, page = 0) {
  // Calcula o índice inicial e final para a página atual
  const startIndex = page * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Obtenha os itens da página atual
  const items = array.slice(startIndex, endIndex);

  // Se não houver mais itens, interrompa a iteração
  if (!items.length) return;

  // Retorna os itens da página atual
  yield items;

  // Continue para a próxima página
  yield* getAllPagedData(array, itemsPerPage, page + 1);
}