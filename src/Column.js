import React from 'react'
import dataKeys from '../dataKeys.json'

const maxLogit = Math.log(1.0)
const minLogit = Math.log(1e-5)

const rgb = ['#ff0000', '#00cc00', '#2266ff']
const headColor = i => rgb[i % 3]

function Attention(props) {
    if (!props.weight) {
        return <div></div>
    }

    return <div className='z-10 grow flex flex-col'>
        {
            props.weight[dataKeys.heads].map((w, i) =>
                <div className='w-full grow basis-1' key={i} style={{background: headColor(i), opacity: w}}></div>
            )
        }
    </div>
}

function ProbCell(props) {
    let key = props.k
    let opacity = 0

    if (props.prob > 0) {
        opacity = (Math.log(props.prob) - minLogit) / (maxLogit - minLogit)
    }
    let attention
    if ('attention' in props) {
        attention = <Attention weight={props.attention} />
    } else {
        attention = <div style={{height: '8px', flexBasis: '8px'}}></div>
    }
    let hoverMatchStyle = {
        // Repeat the glow effect 3 times so it's brighter
        textShadow: 'white 0px 0px 12px, white 0px 0px 12px, white 0px 0px 12px',
        zIndex: 5
    }
    return <div className='flex flex-col grow justify-center' onMouseOver={_ => props.hover && props.hover(key)} onMouseOut={_ => props.hover && props.hover(null)}>
            {attention}
            <div className='px-1 flex flex-col grow justify-end h-5' style={props.hoveredToken && props.hoveredToken == key ? hoverMatchStyle : {}}>
                <span style={{opacity: opacity}}>{key}</span>
            </div>
    </div>
}

export function TopColumn(props) {
    return <div className='top-column grow' style={{display: "flex", flexDirection: "column"}}>
        <div className='p-1'>{props.data[dataKeys.input_token]}</div>
        {
            props.data[dataKeys.rows].map((r, i) => {
                const top_token = Object.keys(r[dataKeys.top_tokens])[0]
                return <div key={i} className='flex flex-row grow'>
                    <ProbCell hoveredToken={props.hoveredToken} hover={props.hover}
                    r={r} k={top_token} isTop={true}
                    prob={r[dataKeys.top_tokens][top_token]}
                    attention={props.attentionPattern && props.attentionPattern[i]}/>
                </div>
            })
        }
        <div className='p-1'>{props.data[dataKeys.target_token]}</div>
    </div>
}

export function Column(props) {
    let t = props.data
    
    let rest = []
    let cells = []
    if (props.renderAll) {
        for (let j = 0; j < t[dataKeys.rows].length; j++) {
            let l = t[dataKeys.rows][j]
            let token_cells = []
            let top_tokens = Object.keys(l[dataKeys.top_tokens])
            for (let ki = 1; ki < top_tokens.length; ki++) {
                let key = top_tokens[ki]
                let prob = l[dataKeys.top_tokens][key]
                token_cells.push(
                    <ProbCell hoveredToken={props.hoveredToken}
                        hover={props.setHoveredToken}
                        prob={prob}
                        r={l} k={key} key={ki} top={false} />
                )
            }
            cells.push(
                <div key={j} className='flex flex-row cell-row grow'>
                    {token_cells}
                </div>
            )
        }
    }
    rest = <div className='flex flex-col overflow-hidden' key={props.index} style={{width: '400px'}}>
        <div style={{height: '27px'}}></div>
            {cells}
        <div style={{height: '27px'}}></div>
    </div>

    let className = 'outer-column flex flex-row snap-end items-stretch grow bg-black'
    if (!props.sliding) {
        className += ' fixed-column'
    }
    return <div key={props.index} style={{position: props.sliding ? 'static' : 'relative', left: (-400 * props.index) + 'px', 'visibility': props.invisible ? 'hidden' : 'visible'}} className={className}>
        <TopColumn hoveredToken={props.hoveredToken}
            hover={props.setHoveredToken} data={props.data}
            attentionPattern={props.attentionPattern}>
        </TopColumn>
        {rest}
    </div>
}
