export class ServerList {
    _servers = [];
    _serverFactory;
    constructor(serverFactory) {
        this._serverFactory = serverFactory;
    }
    async create() {
        const server = await this._serverFactory();
        this._servers.push(server);
        return server;
    }
    async close(server) {
        await server.close();
        const index = this._servers.indexOf(server);
        if (index !== -1)
            this._servers.splice(index, 1);
    }
    async closeAll() {
        await Promise.all(this._servers.map((server) => server.close()));
    }
}
