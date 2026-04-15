FROM heroiclabs/nakama:3.22.0

COPY build /nakama/data/modules
COPY data /nakama/data

ENTRYPOINT ["/bin/sh", "-ecx"]

CMD ["/nakama/nakama migrate up --database.address root@cockroach:26257 && exec /nakama/nakama --name nakama1 --database.address root@cockroach:26257 --logger.level DEBUG --session.token_expiry_sec 7200 --runtime.path /nakama/data/modules --runtime.js_entrypoint main.js --runtime.http_key=supersecret --socket.server_key=supersecret --console.username=admin --console.password=admin123 --console.signing_key=supersecret --session.encryption_key=supersecret --session.refresh_encryption_key=supersecret"]