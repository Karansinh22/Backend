function toJsonOld(status, message, result=[], code = 200) {
    const data = {
        status: status,
        message: message,
        result: (result.length == 0 ? {} : result)
    };
    return data
}

function toJson(message, result=[], code = 200) {
    const data = {
        message: message,
        result: (result.length == 0 ? {} : result)
    };
    return data;
}

function toJsonSocket(status, message, result=[], code = 200) {
    const data = {
        status: status,
        message: message,
        result: (result.length == 0 ? {} : result)
    };
    return data
}

function makeDataTablesResponse(query,pageSize,page,tableHeaders,orderBy){
    const data = {
        response : {
            data : query.rows,
            perPage : pageSize,
            totalElements : query.count,
            totalPages : Math.ceil(Math.abs(parseInt(query.count) / pageSize)),
            pageNumber: page ? page : 1,
            tableHeaders : tableHeaders,
            orderBy : orderBy,
        },
    }
    return data
}

function throwCustomError(statusCode, message) {
    const error = new Error(message);
    error.message = message;
    error.statusCode = statusCode;
    throw error;
}

module.exports = {
    toJson : toJson,
    makeDataTablesResponse : makeDataTablesResponse,
    toJsonSocket : toJsonSocket,
    throwCustomError : throwCustomError,
}