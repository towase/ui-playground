import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { parseWithValibot } from '@conform-to/valibot'
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
import * as v from 'valibot'

const userRegistrationSchema = v.pipe(
  v.object({
    username: v.pipe(
      v.string('ユーザー名を入力してください'),
      v.minLength(3, 'ユーザー名は3文字以上である必要があります'),
      v.maxLength(20, 'ユーザー名は20文字以下である必要があります'),
    ),
    email: v.pipe(
      v.string('メールアドレスを入力してください'),
      v.email('有効なメールアドレスを入力してください'),
    ),
    password: v.pipe(
      v.string('パスワードを入力してください'),
      v.minLength(8, 'パスワードは8文字以上である必要があります'),
    ),
    confirmPassword: v.string('パスワード（確認）を入力してください'),
    age: v.pipe(
      v.number('年齢を入力してください'),
      v.integer('年齢は整数で入力してください'),
      v.minValue(13, '13歳以上である必要があります'),
      v.maxValue(120, '有効な年齢を入力してください'),
    ),
    country: v.pipe(
      v.picklist(
        ['japan', 'usa', 'uk', 'canada', 'australia', 'other'],
        '国を選択してください',
      ),
    ),
  }),
  v.forward(
    v.check(
      data => data.password === data.confirmPassword,
      'パスワードが一致しません',
    ),
    ['confirmPassword'],
  ),
)

type UserFormData = v.InferInput<typeof userRegistrationSchema>

interface ActionState {
  success: boolean
  message: string
  data?: UserFormData
}

async function submitUserRegistration(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const submission = parseWithValibot(formData, {
    schema: userRegistrationSchema,
  })

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
      validationLibrary: 'valibot',
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

export function FormValibot() {
  const [state, formAction] = useActionState(submitUserRegistration, {
    success: false,
    message: '',
  })

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema: userRegistrationSchema })
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
              <Chip label="Valibot で検証済み" color="secondary" size="small" />
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
