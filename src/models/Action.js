import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema({
    fromAddress: {type: mongoose.Schema.Types.String, required: true},
    toAddress: {type: mongoose.Schema.Types.String, required: true},
    date: {type: mongoose.Schema.Types.Date, default: Date.now, required: true},
    amount: {type: mongoose.Schema.Types.Number, required: true},
},
{
    versionKey: false,
    collection: 'actions'
});

const Action = mongoose.model('Action', actionSchema);

export default Action;