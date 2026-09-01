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
  const clientTime = getOperationTimestamp(clientOp);
  const serverTime = getOperationTimestamp(serverOp);
  return clientTime > serverTime
    ? clientOp
    : { type: "reject" };
}

function getOperationTimestamp(operation) {
  const timestamp = new Date(operation?.timestamp).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function getOperationKind(operation) {
  return operation?.type?.split("-")[0];
}

function getOperationEntityId(operation) {
  return Array.isArray(operation?.data) ? null : operation?.data?.id;
}

function transformSingleOperation(clientOp, serverOp) {
  const clientKind = getOperationKind(clientOp);
  const serverKind = getOperationKind(serverOp);
  // 不同资源互不影响,相同资源的不同 ID 也可以并存
  if (clientKind !== serverKind) return clientOp;

  const clientId = getOperationEntityId(clientOp);
  const serverId = getOperationEntityId(serverOp);

  if (clientOp.type === "bookmark-add" && serverOp.type === "bookmark-add") {
    // 同一个书签仍按时间戳解决，只有不同书签才做位置错开
    if (clientId && serverId && clientId === serverId) {
      return resolveUpdateConflictLWW(clientOp, serverOp);
    }
    // 书签位置过近时向后顺延，避免多个书签渲染时重叠
    if (
      Math.abs(clientOp.data.scrollPercent - serverOp.data.scrollPercent) <
      0.005
    ) {
      const scrollPercent = Math.min(
        1,
        Math.max(0, clientOp.data.scrollPercent + 0.005),
      );
      return {
        ...clientOp,
        data: {
          ...clientOp.data,
          scrollPercent,
        },
      };
    }
    return clientOp;
  }

  if (clientId && serverId && clientId !== serverId) return clientOp;

  // 避免旧更新复活已删除对象
  if (clientId && serverId && clientId === serverId) {
    const clientIsDelete = clientOp.type.endsWith("-delete");
    const serverIsDelete = serverOp.type.endsWith("-delete");
    if (clientIsDelete !== serverIsDelete) {
      return resolveUpdateConflictLWW(clientOp, serverOp);
    }
  }

  return clientOp.type === serverOp.type
    ? resolveUpdateConflictLWW(clientOp, serverOp)
    : clientOp;
}

function transformOperation(operation, operationQueue, clientVersion) {
  let transformedOp = {
    ...operation,
    timestamp: operation.timestamp || new Date().toISOString(),
  };
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
