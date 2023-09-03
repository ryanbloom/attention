import React from 'react'
import { Column } from './Column'
import allData from '../data.json'
import dataKeys from '../dataKeys.json'
import { CoverPage } from './CoverPage'

export function App() {
    let [hoveredToken, setHoveredToken] = React.useState(null)
    let [selectedSentenceIndex, selectSentence] = React.useState(0)
    let [dummyState, setDummyState] = React.useState(false)

    let scrollContainer = React.createRef()

    function didMount() {
        scrollContainer.current.addEventListener(
            'scroll',
            () => setDummyState(Date.now()), // TODO: check for better way to do this
            { passive: true }
        )
    }
    React.useEffect(didMount, [])
    
    const runnerUpWidth = 400
    let topChoicesWidth = 0
    
    let children = document.querySelectorAll('.fixed-column')
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
    
    let data = allData[dataKeys.data][selectedSentenceIndex]
    attention = data[dataKeys.columns][lastFixedIndex][dataKeys.attention]
    let columns = data[dataKeys.columns].map((t, i) =>
        <Column data={t} index={i} key={i}
            invisible={i >= slidingIndex}
            sliding={false} renderAll={i == slidingIndex - 1}
            attentionPattern={i <= lastFixedIndex && attention[i]}
            hoveredToken={i == lastFixedIndex ? hoveredToken : null}
            setHoveredToken={i == lastFixedIndex ? setHoveredToken : null}>
        </Column>
    )
    
    let slidingX = 0
    if (lastFixedChild) {
        let lastFixedLeft = lastFixedContainer.getBoundingClientRect().left
        let lastFixedRight = lastFixedLeft + lastFixedColumnExpandedWidth - 1
        let gap = window.innerWidth - lastFixedRight
        let maxGap = 100
        if (slidingTopColumn) {
            maxGap = slidingTopColumn.getBoundingClientRect().width
        }
        let slidingFraction = 1 - (gap / maxGap)
        slidingX = slidingFraction * (expandedSlidingColumnWidth + 10)
    }
    if (slidingIndex < data[dataKeys.columns].length) {
        let slidingColumnData = data[dataKeys.columns][slidingIndex]
        slidingColumn = <Column data={slidingColumnData} index={slidingIndex} sliding={true} renderAll={true}>
            hoveredToken={hoveredToken} setHoveredToken={setHoveredToken}
        </Column>
    }

    const layerLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(x => `Layer ${x}`)

    return <div className='relative'>

        <div ref={scrollContainer} className='flex flex-row w-full min-h-screen overflow-scroll snap-x snap-mandatory'>
            <div className='p-12 box-border shrink-0'
                style={{flexBasis: 'calc(100% - 400px - 43px - 5rem)'}}>
                <div className='flex flex-col w-full pl-12'>
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
