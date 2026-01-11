'use client';

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export default function EmojiPicker({onSelect}){
    return (
        <Picker data={data}
        onEmojiSelect={(emoji) => onSelect(emoji.native)}
      theme="light"
      />
    )
}