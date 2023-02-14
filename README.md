# Private Voting MVP

Project này sử dụng framework phổ biến cho các ứng dụng blockchain: hardhat

Cách chạy:
- clone project về.
- Gõ lệnh sau để cập nhật thư viện: npm i
- file hardhat.config.js lưu cấu hình project cũng như các biến toàn cục như ví người dùng
- Thư mục contracts lưu các đoạn mã smart contract
- Thư mục circuits lưu các file circom phục vụ ZK snark
- Thư mục scripts lưu những mã code tương tác của người dùng
    + deploy.js là file để deploy contract lên blockchain
    + poll.js là core các hàm tương tác với contract
    + createPoll.js là hàm tạo poll (file custom để sử dụng file core trên)
- Giả sử để chạy file createPoll này gõ lệnh sau: npx hardhat run .\scripts\createPoll.js --network testbsc
(network để chỉ mạng blockchain mà đoạn code trên tương tác)