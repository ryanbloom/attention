import React from 'react'

const cleanToken = t => t.replace('Ġ', ' ').replace('Ċ', ' ')

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
            props.weight.heads.map((w, i) =>
                <div className='w-full grow basis-1' key={i} style={{background: headColor(i), opacity: w}}></div>
            )
        }
    </div>
}

function ProbCell(props) {
    let key = props.k

    let opacity = (Math.log(props.prob) - minLogit) / (maxLogit - minLogit)
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
                <span style={{opacity: opacity}}>{cleanToken(key)}</span>
            </div>
    </div>
}

export function TopColumn(props) {
    return <div className='top-column grow' style={{display: "flex", flexDirection: "column"}}>
        <div className='p-1'>{cleanToken(props.data.input_token)}</div>
        {
            props.data.rows.map((r, i) => {
                const top_token = Object.keys(r.top_tokens)[0]
                return <div key={i} className='flex flex-row grow'>
                    <ProbCell hoveredToken={props.hoveredToken} hover={props.hover}
                    r={r} k={top_token} isTop={true}
                    prob={r.top_tokens[top_token]}
                    attention={props.attentionPattern && props.attentionPattern[i]}/>
                </div>
            })
        }
        <div className='p-1'>{cleanToken(props.data.target_token)}</div>
    </div>
}

export function Column(props) {
    let t = props.data
    
    let rest = []
    if (!props.topOnly) {
        let cells = []
        for (let j = 0; j < t.rows.length; j++) {
            let l = t.rows[j]
            let token_cells = []
            let top_tokens = Object.keys(l.top_tokens)
            for (let ki = 1; ki < top_tokens.length; ki++) {
                let key = top_tokens[ki]
                let prob = l.top_tokens[key]
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
        rest = <div className='flex flex-col overflow-hidden' key={props.index} style={{width: '400px'}}>
            <div style={{height: '27px'}}></div>
                {cells}
            <div style={{height: '27px'}}></div>
        </div>
    }

    return <div key={props.index} className='outer-column flex flex-row snap-end items-stretch grow bg-black'>
        <TopColumn hoveredToken={props.hoveredToken}
            hover={props.setHoveredToken} data={props.data}
            attentionPattern={props.attentionPattern}>
        </TopColumn>
        {rest}
    </div>
}
