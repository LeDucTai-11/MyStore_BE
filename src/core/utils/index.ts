export class Pagination {
  static of(take: number, skip: number, totalRecords: number, data: any) {
    return {
      skippedRecords: skip,
      totalRecords,
      data,
      pages: Math.ceil(totalRecords / data.length),
      hasNext: totalRecords > take + skip,
    };
  }
}

export const forceDataToArray = (data: any) => {
  if (!data) return [];
  else if (!Array.isArray(data)) {
    const arr = [];
    arr.push(data);
    return arr;
  }
  return data;
};

export const getOrderBy = (order: string) => {
  const [field, orderDirection] = order.split(':');
  return {
    [field]: orderDirection,
  };
};

export const isEnumValue = (enumType: any, value: any) => {
  return Object.values(enumType).includes(value);
}
