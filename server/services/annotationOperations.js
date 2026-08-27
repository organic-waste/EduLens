/* 操作与更新标注 */
function updateById(items, item) {
  const index = items.findIndex((current) => current.id === item.id);
  if (index >= 0) items[index] = item;
  else items.push(item);
}

function applyOperationToData(data, operation) {
  const newData = { ...data };
  switch (operation.type) {
    case "bookmark-add":
      newData.bookmarks = [...(newData.bookmarks || [])];
      updateById(newData.bookmarks, operation.data);
      break;
    case "bookmark-update":
      if (Array.isArray(operation.data)) newData.bookmarks = operation.data;
      else {
        newData.bookmarks = [...(newData.bookmarks || [])];
        updateById(newData.bookmarks, operation.data);
      }
      break;
    case "bookmark-delete":
      newData.bookmarks = (newData.bookmarks || []).filter(
        (item) => item.id !== operation.data.id,
      );
      break;
    case "canvas-update":
      newData.canvas = operation.data;
      break;
    case "rectangle-add":
      newData.rectangles = [...(newData.rectangles || [])];
      updateById(newData.rectangles, operation.data);
      break;
    case "rectangle-update":
      if (Array.isArray(operation.data)) newData.rectangles = operation.data;
      else {
        newData.rectangles = [...(newData.rectangles || [])];
        updateById(newData.rectangles, operation.data);
      }
      break;
    case "rectangle-delete":
      newData.rectangles = (newData.rectangles || []).filter(
        (item) => item.id !== operation.data.id,
      );
      break;
    case "image-add":
    case "image-update":
      newData.images = [...(newData.images || [])];
      updateById(newData.images, operation.data);
      break;
    case "image-delete":
      newData.images = (newData.images || []).filter(
        (item) => item.id !== operation.data.id,
      );
      break;
    default:
      throw new Error(`Unsupported annotation operation: ${operation.type}`);
  }
  return newData;
}

function resolveUpdateConflictLWW(clientOp, serverOp) {
  return new Date(clientOp.timestamp).getTime() >
    new Date(serverOp.timestamp).getTime()
    ? clientOp
    : { type: "reject" };
}

function transformSingleOperation(clientOp, serverOp) {
  // 不同矩形互不影响
  if (
    clientOp.type.startsWith("rectangle-") &&
    serverOp.type.startsWith("rectangle-")
  ) {
    return clientOp.data.id === serverOp.data.id
      ? resolveUpdateConflictLWW(clientOp, serverOp)
      : clientOp;
  }
  if (clientOp.type === "bookmark-add" && serverOp.type === "bookmark-add") {
    // 书签位置过近时向后顺延，避免多个书签渲染时重叠
    if (
      Math.abs(clientOp.data.scrollPercent - serverOp.data.scrollPercent) <
      0.005
    ) {
      return {
        ...clientOp,
        data: {
          ...clientOp.data,
          scrollPercent: clientOp.data.scrollPercent + 0.005,
        },
      };
    }
    return clientOp;
  }
  return clientOp.type === serverOp.type
    ? resolveUpdateConflictLWW(clientOp, serverOp)
    : clientOp;
}

function transformOperation(operation, operationQueue, clientVersion) {
  let transformedOp = { ...operation };
  // 只转换客户端版本之后的服务端操作
  for (let index = clientVersion; index < operationQueue.length; index += 1) {
    if (transformedOp.type === "reject") break;
    transformedOp = transformSingleOperation(
      transformedOp,
      operationQueue[index],
    );
  }
  return transformedOp;
}

module.exports = { applyOperationToData, transformOperation };
