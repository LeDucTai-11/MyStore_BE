export class Pagination {
    static of (take: number,skip: number, totalRecords: number, data: any) {
        return {
            skippedRecords: skip,
            totalRecords,
            data,
            pages: Math.ceil(totalRecords / data.length),
            hasNext: totalRecords > take + skip,
        }
    }
}