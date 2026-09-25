import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod/v4'
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useActionState } from 'react'
import { z } from 'zod'

const userRegistrationSchema = z
  .object({
    username: z
      .string({ message: 'ユーザー名を入力してください' })
      .min(3, 'ユーザー名は3文字以上である必要があります')
      .max(20, 'ユーザー名は20文字以下である必要があります'),
    email: z
      .string({ message: 'メールアドレスを入力してください' })
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string({ message: 'パスワードを入力してください' })
      .min(8, 'パスワードは8文字以上である必要があります'),
    confirmPassword: z.string({
      message: 'パスワード（確認）を入力してください',
    }),
    age: z
      .number({ message: '年齢を入力してください' })
      .int('年齢は整数で入力してください')
      .min(13, '13歳以上である必要があります')
      .max(120, '有効な年齢を入力してください'),
    country: z.enum(['japan', 'usa', 'uk', 'canada', 'australia', 'other'], {
      message: '国を選択してください',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'パスワードが一致しません',
        path: ['confirmPassword'],
      })
    }
  })

type UserFormData = z.infer<typeof userRegistrationSchema>

interface ActionState {
  success: boolean
  message: string
  data?: UserFormData
}

async function submitUserRegistration(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const submission = parseWithZod(formData, { schema: userRegistrationSchema })

  if (submission.status !== 'success') {
    return {
      success: false,
      message: 'フォームにエラーがあります',
    }
  }

  try {
    const existingData = JSON.parse(
      localStorage.getItem('userRegistrations') || '[]',
    )
    const { confirmPassword, ...userData } = submission.value
    const newData = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
      validationLibrary: 'zod',
    }
    existingData.push(newData)
    localStorage.setItem('userRegistrations', JSON.stringify(existingData))

    return {
      success: true,
      message: 'ユーザー登録が完了しました',
      data: submission.value,
    }
  } catch (error) {
    return {
      success: false,
      message: 'データの保存に失敗しました',
    }
  }
}

export function FormZod() {
  const [state, formAction] = useActionState(submitUserRegistration, {
    success: false,
    message: '',
  })

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: userRegistrationSchema })
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <Box
      component="form"
      {...getFormProps(form)}
      action={formAction}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <TextField
        {...getInputProps(fields.username, { type: 'text' })}
        label="ユーザー名"
        fullWidth={true}
        error={!!fields.username.errors}
        helperText={fields.username.errors}
      />

      <TextField
        {...getInputProps(fields.email, { type: 'email' })}
        label="メールアドレス"
        type="email"
        fullWidth={true}
        error={!!fields.email.errors}
        helperText={fields.email.errors}
      />

      <TextField
        {...getInputProps(fields.password, { type: 'password' })}
        label="パスワード"
        type="password"
        fullWidth={true}
        error={!!fields.password.errors}
        helperText={fields.password.errors}
      />

      <TextField
        {...getInputProps(fields.confirmPassword, { type: 'password' })}
        label="パスワード（確認）"
        type="password"
        fullWidth={true}
        error={!!fields.confirmPassword.errors}
        helperText={fields.confirmPassword.errors}
      />

      <TextField
        {...getInputProps(fields.age, { type: 'number' })}
        label="年齢"
        type="number"
        fullWidth={true}
        error={!!fields.age.errors}
        helperText={fields.age.errors}
        slotProps={{ htmlInput: { min: 13, max: 120 } }}
      />

      <FormControl fullWidth={true} error={!!fields.country.errors}>
        <InputLabel>国</InputLabel>
        <Select {...getSelectProps(fields.country)} label="国" defaultValue="">
          <MenuItem value="japan">日本</MenuItem>
          <MenuItem value="usa">アメリカ</MenuItem>
          <MenuItem value="uk">イギリス</MenuItem>
          <MenuItem value="canada">カナダ</MenuItem>
          <MenuItem value="australia">オーストラリア</MenuItem>
          <MenuItem value="other">その他</MenuItem>
        </Select>
        <FormHelperText>{fields.country.errors}</FormHelperText>
      </FormControl>

      <Button type="submit" variant="contained" size="large">
        ユーザー登録
      </Button>

      {state.message && (
        <Box
          sx={{
            p: 2,
            bgcolor: state.success ? 'success.light' : 'error.light',
            borderRadius: 1,
          }}
        >
          <Typography color={state.success ? 'success.dark' : 'error.dark'}>
            {state.message}
          </Typography>
          {state.success && state.data && (
            <Box sx={{ mt: 1 }}>
              <Chip label="Zod で検証済み" color="primary" size="small" />
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                データはLocalStorageに保存されました
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}
