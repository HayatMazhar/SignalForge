import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { chatApi } from '../src/api/stocks';

const C = {
  bg: '#06060B',
  surface: '#0C0F1A',
  accent: '#00FF94',
  danger: '#FF3B5C',
  textPrimary: '#F0F4F8',
  textMuted: '#5B6378',
  border: '#1A1F35',
  warning: '#FFB020',
  info: '#38BDF8',
  purple: '#A78BFA',
};

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export default function ChatScreen() {
  const { symbol } = useLocalSearchParams<{ symbol?: string }>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'ai',
      text: symbol
        ? `Hi! I'm your AI trading assistant. I see you're looking at ${symbol}. Ask me anything about it — signals, technicals, or trade ideas.`
        : "Hi! I'm your AI trading assistant. Ask me about any stock, signal, or market trend.",
    },
  ]);
  const flatListRef = useRef<FlatList>(null);

  const sendMutation = useMutation({
    mutationFn: (message: string) => chatApi.send(message, symbol),
    onSuccess: (data) => {
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'ai',
        text: data?.response ?? data?.message ?? 'I couldn\'t generate a response. Please try again.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'ai',
          text: 'Something went wrong. Please try again.',
        },
      ]);
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    sendMutation.mutate(trimmed);
  }, [input, sendMutation]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color={C.accent} />
          </View>
        )}
        <View
          style={[
            styles.bubbleContent,
            isUser ? styles.userBubbleContent : styles.aiBubbleContent,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userBubbleText : styles.aiBubbleText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListFooterComponent={
          sendMutation.isPending ? (
            <View style={styles.typingRow}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color={C.accent} />
              </View>
              <View style={styles.typingDots}>
                <View style={styles.dot} />
                <View style={[styles.dot, styles.dotDelay1]} />
                <View style={[styles.dot, styles.dotDelay2]} />
              </View>
            </View>
          ) : null
        }
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about any stock or signal..."
          placeholderTextColor={C.textMuted}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!input.trim() || sendMutation.isPending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          activeOpacity={0.7}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator color={C.bg} size="small" />
          ) : (
            <Ionicons name="send" size={18} color={C.bg} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 16, paddingBottom: 8 },
  bubble: { flexDirection: 'row', marginBottom: 12, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiBubble: { alignSelf: 'flex-start' },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubbleContent: { borderRadius: 16, padding: 14, flex: 1 },
  userBubbleContent: {
    backgroundColor: C.accent,
    borderBottomRightRadius: 4,
  },
  aiBubbleContent: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: C.bg },
  aiBubbleText: { color: C.textPrimary },
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  typingDots: { flexDirection: 'row', gap: 4, marginLeft: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.textMuted,
    opacity: 0.5,
  },
  dotDelay1: { opacity: 0.7 },
  dotDelay2: { opacity: 0.9 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: C.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
