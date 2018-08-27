import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
    message: {type: mongoose.Schema.Types.String, required: true},
    type: {type: mongoose.Schema.Types.String, required: true},
    date: {type: mongoose.Schema.Types.Date, default: Date.now, required: true}
},
{
    versionKey: false 
});

export default mongoose.model('Log', logSchema);