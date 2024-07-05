export const updateUserStatusExamples = {
    request: {
        summary: 'Valid input',
        description: 'A valid input example',
        value: {
            roomKey: '123456',
            userId: 1,
            userStatus: 'ACTIVE',
        },
    },
    response: {
        success: {
            message: 'User status updated successfully',
        },
        notFound: {
            statusCode: 404,
            message: 'Match not found',
            error: 'Not Found',
        },
        badRequest: {
            statusCode: 400,
            message: 'Invalid input data',
            error: 'Bad Request',
        },
    },
};
