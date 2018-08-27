import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
    public: {type: mongoose.Schema.Types.String, required: true},
    private: {type: mongoose.Schema.Types.String, required: true},
},
{
    versionKey: false 
});

export default mongoose.model('Wallet', walletSchema);