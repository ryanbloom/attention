import json
import numpy as np
import torch
from transformers import pipeline

from modeling_gpt2 import GPT2LMHeadModel

# We're going to be using these keys a lot, so make them short
keys = {
    'sentences': 's',
    'data': 'd',
    'columns': 'c',
    'input_token': 'i',
    'output_token': 'o',
    'target_token': 't',
    'rows': 'r',
    'top_token': 'p',
    'correct_prob': 'b',
    'top_tokens': 'k',
    'attention': 'a',
    'heads': 'h',
    'reduced': 'e'
}

def clean_token(t):
    t = t.replace('Ġ', ' ')
    t = t.replace('Ċ', ' ')
    return t

def clean_tokens(ts):
    return [clean_token(t) for t in list(ts)]

def approx(x):
    if isinstance(x, float):
        return round(x, 3)
    if isinstance(x, list):
        return [approx(y) for y in x]

def probs_to_dict(p, k=None):
    all_probs = sorted(zip(all_tokens, approx(p)), key=lambda x: x[1], reverse=True)
    if k is None:
        return dict(all_probs)
    else:
        return dict(all_probs[:k])

model = GPT2LMHeadModel.from_pretrained('gpt2')
tokenizer = pipeline('text-generation', model='gpt2').tokenizer
vocab_size = tokenizer.vocab_size

sentences = [
    (
        "Plasma",
        "Sometimes when people say plasma they mean a state of matter. Other times when people say plasma they mean"
    ),
    (
        "Capital cities",
        "Washington, DC is the capital of the United States. London is the capital of the United Kingdom.",
    ),
    (
        "Heroes and villains",
        "Hero: Harry Potter. Villain: Voldemort. Hero: Batman. Villain: The Joker. Hero: Luke Skywalker. Villain: Darth Vader."
    )
]

sentence_datasets = []

for _, s in sentences:
    print(s)
    tokens = tokenizer.encode(s)
    tokens_tensor = torch.tensor(tokens).reshape(1, -1)

    all_tokens = clean_tokens(tokenizer.convert_ids_to_tokens(list(range(vocab_size))))
    input_tokens = clean_tokens(tokenizer.convert_ids_to_tokens(tokens))
    seq_len = len(input_tokens)

    model_output = model(
        tokens_tensor,
        output_hidden_states=True,
        output_attentions=True)

    # PREDICTIONS
    logits = model_output.logits.squeeze()
    # sequence, vocab
    max_logits, max_indices = logits.max(dim=1)
    # sequence
    output_tokens = clean_tokens(tokenizer.convert_ids_to_tokens(max_indices.tolist()))

    # ATTENTION

    att = torch.stack(list(model_output.attentions)).detach()
    # (layers, 1, heads, tokens, tokens)
    att = att.squeeze()
    # (layers, heads, attending_tokens, attended_dokens)
    att = att.permute((2, 3, 0, 1))
    # (attending_tokens, attended_tokens, layers, heads)
    max_values, max_indices = att.max(dim=1, keepdim=True)
    att_heads = att / max_values # along the attended_tokens dimension

    att_reduced = att.sum(dim=3, keepdim=False) # along the heads dimension
    max_values, max_indices = att_reduced.max(dim=1, keepdim=True) # along the attended_tokens dimension
    att_reduced = att_reduced / max_values

    # LOGITS LENS

    all_logits = torch.stack(model_output.lens_logits, dim=0).detach().squeeze()
    # (layer, token, vocab)
    all_logits = all_logits.transpose(0, 1)
    # (token, layer, vocab)

    n_tokens = all_logits.size(0)
    n_layers = all_logits.size(1)

    data_columns = []
    for t in range(n_tokens):
        data_rows = []
        for l in range(n_layers):
            logits = all_logits[t][l]
            probs = torch.nn.functional.softmax(logits, dim=0) # along the vocab dimension
            top_logit, top_index = probs.max(dim=0)
            output_token = clean_token(tokenizer.convert_ids_to_tokens(top_index.item()))

            if t+1 < len(tokens):
                correct_token = tokens[t+1]
                correct_prob = approx(probs[correct_token].item())
            else:
                correct_prob = 0

            row = {
                keys['top_token']: output_token,
                keys['correct_prob']: correct_prob,
                keys['top_tokens']: probs_to_dict(probs.numpy().tolist(), k=10),
            }
            
            data_rows.append(row)

        col = {
            keys['input_token']: input_tokens[t],
            keys['output_token']: output_tokens[t],
            keys['target_token']: input_tokens[t+1] if t+1 < len(input_tokens) else '',
            keys['rows']: data_rows,
            keys['attention']: [
                [
                    {
                        keys['heads']: approx(att_heads[t][i][j].tolist()),
                        keys['reduced']: approx(att_reduced[t][i][j].item()),
                    } for j in range(att_heads.shape[2])
                ] for i in range(att_heads.shape[1])
            ]
        }

        data_columns.append(col)

    data = {
        keys['columns']: data_columns[:-1],
    }
    sentence_datasets.append(data)

all_data = {
    keys['sentences']: [short for short, _ in sentences],
    keys['data']: sentence_datasets
}
with open('data.json', 'w+') as f:
    json.dump(all_data, f, indent='\t')
