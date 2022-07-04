import React from 'react'
import { Column } from './Column'
import allData from '../data.json'

function CoverPage(props) {
    return <div style={{maxWidth: '600px'}}>
        <div className='pb-8'>
            <h1 style={{maxWidth: '400px'}}>Visualizing Transformers with Logits and Attention</h1>
            <div className='mt-2 text-gray-400'><a href='http://ryan-bloom.com' className='subtle'>Ryan Bloom</a> | July 2022</div>
        </div>
        <p>
            This is a visualization of <a href='https://huggingface.co/gpt2'>GPT-2-small</a> predicting tokens in a string of text. Best viewed on a large screen.
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
            of <a href='https://www.lesswrong.com/posts/AcKRB8wDpdaN6v6ru/interpreting-gpt-the-logit-lens'>nostalgebraist's logits lens</a> technique.
            (Unlike nostalgebraist, I'm taking activations after the MLP, and applying the final LayerNorm before the output layer.
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

export function App() {
    let [hoveredToken, setHoveredToken] = React.useState(null)
    let [expandedAttentionLayer, setAttentionHover] = React.useState(null)
    let [selectedSentenceIndex, selectSentence] = React.useState(0)
    let [dummyState, setDummyState] = React.useState(false)

    let scrollContainer = React.createRef()

    function didMount() {
        scrollContainer.current.addEventListener(
            'scroll',
            () => setDummyState(Date.now()),
            { passive: true }
        )
    }
    React.useEffect(didMount, [])
    
    const runnerUpWidth = 400
    let topChoicesWidth = 0
    
    let children = document.querySelectorAll('.outer-column')
    let maxX = document.body.getBoundingClientRect().width
    let lastFixedIndex = 0
    let lastFixedChild = null
    let lastFixedContainer = null
    let x = 0
    for (let i = 0; i < children.length; i++) {
        let child = children[i].querySelector('.top-column')
        let w = child.getBoundingClientRect().width
        if (i == 0) {
            x = children[0].getBoundingClientRect().x
        }
        x += w
        if (x + runnerUpWidth > maxX + 1) {
            break
        }
        topChoicesWidth = w
        lastFixedIndex = i
        lastFixedChild = child
        lastFixedContainer = children[i]
    }
    const lastFixedColumnExpandedWidth = topChoicesWidth + runnerUpWidth
    
    let slidingIndex = lastFixedIndex + 1
    let slidingColumn = []
    let expandedSlidingColumnWidth = 0
    let attention = null

    let slidingTopColumn
    if (slidingIndex < children.length) {
        slidingTopColumn = children[slidingIndex].querySelector('.top-column')
        expandedSlidingColumnWidth = slidingTopColumn.getBoundingClientRect().width + runnerUpWidth
    }
    
    let data = allData.data[selectedSentenceIndex]
    attention = data.columns[lastFixedIndex].attention
    let columns = data.columns.map((t, i) =>
        <Column data={t} index={i} key={i}
            topOnly={i != lastFixedIndex}
            attentionPattern={i <= lastFixedIndex && attention[i]}
            hoveredToken={i == lastFixedIndex ? hoveredToken : null}
            setHoveredToken={i == lastFixedIndex ? setHoveredToken : null}
            setAttentionHover={setAttentionHover}
            hoveredAttentionLayer={expandedAttentionLayer}>
        </Column>
    )
    
    let slidingX = 0
    if (lastFixedChild) {
        let lastFixedLeft = lastFixedContainer.getBoundingClientRect().left
        let lastFixedRight = lastFixedLeft + lastFixedColumnExpandedWidth
        let gap = window.innerWidth - lastFixedRight
        let maxGap = 100
        if (slidingTopColumn) {
            maxGap = slidingTopColumn.getBoundingClientRect().width
        }
        let slidingFraction = 1 - (gap / maxGap)
        slidingX = (slidingFraction * expandedSlidingColumnWidth)
    }
    if (slidingIndex < data.columns.length) {
        let slidingColumnData = data.columns[slidingIndex]
        slidingColumn = <Column data={slidingColumnData} index={slidingIndex} topOnly={false}>
            hoveredToken={hoveredToken} setHoveredToken={setHoveredToken}
        </Column>
    }

    const layerLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(x => `Layer ${x}`)

    return <div className='relative'>

        <div ref={scrollContainer} className='flex flex-row w-full min-h-screen overflow-scroll snap-x snap-mandatory hide-scrollbars'>
            <div id='cover'>
                <div className='flex flex-col w-full'>
                    <CoverPage selectedSentenceIndex={selectedSentenceIndex} selectSentence={selectSentence} />
                </div>
            </div>

            <div className='flex flex-col basis-20 shrink-0 text-gray-400'>
                <div className='flex flex-col items-end'>
                    <span className='py-1 pr-3'>Input</span>
                </div>
                {
                    layerLabels.map((l, i) => 
                        <div key={i} className='flex grow flex-col justify-end items-end'>
                            <span className='pr-3'>{l}</span>
                        </div>
                    )
                }
                <div className='flex flex-col items-end'>
                    <span className='py-1 pr-3'>Target</span>
                </div>
            </div>

            {columns}
        </div>
        <div style={{position: 'absolute', top: '0', right: -(slidingX) + 'px', minHeight: '100vh'}} className={`${lastFixedChild ? 'block' : 'hidden'} sliding-column z-20 pointer-events-none flex flex-col h-full`}>
            {slidingColumn}
        </div>
    </div>
}
