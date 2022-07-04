import React from 'react'
import allData from '../data.json'

export function CoverPage(props) {
    return <div style={{maxWidth: '600px'}}>
        <div className='pb-8'>
            <h1 className='p-0 m-0 mb-2' style={{maxWidth: '400px'}}>Visualizing Transformers with Logits and Attention</h1>
            <div className='text-gray-400'><a href='http://ryan-bloom.com' className='subtle'>Ryan Bloom</a> | July 2022</div>
        </div>
        <p>
            This is a visualization of <a href='https://huggingface.co/gpt2' target='_blank'>GPT-2-small</a> predicting tokens in a string of text. Best viewed on a large screen.
        </p>
        Text: <select value={props.selectedSentenceIndex} onChange={e => props.selectSentence(e.target.value)}>
            {
                allData.sentences.map((s, i) =>
                    <option key={i} value={i}>{s}</option>
                )
            }
        </select>
        <p>
            At the top of each column is a token being fed into the model. At the bottom is the next token in the sentence, which the model is trying to predict.
            In between are the 12 layers of the model.
        </p>
        <p>
            The word in each cell is an intermediate "best guess" computed using a variant
            of <a href='https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens' target='_blank'>nostalgebraist's logits lens</a> technique.
            (Unlike nostalgebraist, I'm taking activations after the MLP, and applying the final layer norm before the output layer.
            This gives similar but more confident results: later layers sometimes concentrate probability on a single token.)
            The rightmost column is expanded to show "runner-up" tokens as well. A token's brightness corresponds to its logit.
        </p>
        <p>
            Attention patterns are shown in the stripes above the corresponding layer, one for each head.
            The brightness of a stripe indicates how much attention is paid to that column by the one on the right.
            The colors are just to distinguish adjacent heads; they don't mean anything special.
        </p>
        <div className='mt-8' style={{display: 'flex', flexDirection: 'row', justifyContent: 'end'}}>
            <div style={{display: 'inline-block'}} className='text-gray-400'>
            Scroll →
            </div>
        </div>
    </div>
}
